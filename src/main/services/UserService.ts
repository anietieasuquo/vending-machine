import {
  commonUtils,
  logger,
  MongoSession,
  Objects,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { Amount, User } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import { sha256 } from '@main/util/commons';
import { RoleService } from '@main/services/RoleService';
import { PurchaseService } from '@main/services/PurchaseService';
import { UserRequest } from '@main/types/dto';
import { InternalServerException } from '@main/exception/InternalServerException';
import { BadRequestException } from '@main/exception/BadRequestException';
import { DuplicateEntryException } from '@main/exception/DuplicateEntryException';
import { AccessClientService } from '@main/services/AccessClientService';

class UserService {
  public constructor(
    private readonly userRepository: TransactionalCrudRepository<User>,
    private readonly roleService: RoleService,
    private readonly accessClientService: AccessClientService
  ) {}

  public async createUser(request: UserRequest): Promise<User> {
    const { username, password, deposit, role, machine } = request;
    Objects.requireNonEmpty(
      [username, password, role, machine],
      new BadRequestException('Invalid user data, cannot be serviced')
    );

    this.checkUsernameAndPassword(username, password);

    const [client, roleResult] = await Promise.all([
      this.accessClientService.findSecretBy({ name: machine }),
      this.roleService.findRoleByName(role)
    ]);
    client.orElseThrow(new NotFoundException('Machine not found'));
    roleResult.orElseThrow(new NotFoundException('Role not found'));

    const roleRecord = roleResult.get();

    if (roleRecord.isAdmin) {
      throw new BadRequestException('Invalid role for user');
    }

    (await this.findUserByUsername(username)).ifPresentThrow(
      new DuplicateEntryException('User already exists')
    );

    let depositValue = 0;
    if (role.toLowerCase() === 'buyer') {
      this.checkDeposit(deposit);
      depositValue = deposit!.value;
    }

    logger.debug('User does not exist');
    const shaPassword = sha256(password);

    logger.debug('Creating user');

    const userData = <User>{
      username,
      deposit: { ...deposit, value: depositValue },
      roleId: roleRecord.id,
      password: shaPassword,
      machineId: client.get().id
    };

    Objects.requireTrue(
      commonUtils.isSafe(userData),
      new BadRequestException('Invalid user data')
    );
    return await this.userRepository.create(userData);
  }

  public async createAdmin(request: UserRequest): Promise<User> {
    const { username, password, deposit, role, machine } = request;
    Objects.requireNonEmpty(
      [username, password, role, machine],
      new BadRequestException('Invalid user data, cannot be serviced')
    );

    this.checkUsernameAndPassword(username, password);

    const [client, roleResult] = await Promise.all([
      this.accessClientService.findSecretBy({ name: machine }),
      this.roleService.findRoleByName(role)
    ]);
    client.orElseThrow(new NotFoundException('Machine not found'));
    roleResult.orElseThrow(new NotFoundException('Role not found'));

    const roleRecord = roleResult.get();

    Objects.requireTrue(
      roleRecord.isAdmin,
      new BadRequestException('Invalid role for admin')
    );

    (await this.findUserByUsername(username)).ifPresentThrow(
      new DuplicateEntryException('Admin user already exists')
    );

    logger.debug('Admin user does not exist, creating admin user');
    const shaPassword = sha256(password);

    const userData = <User>{
      username,
      deposit,
      roleId: roleRecord.id,
      password: shaPassword,
      machineId: client.get().id,
      isAdmin: true
    };

    Objects.requireTrue(
      commonUtils.isSafe(userData),
      new BadRequestException('Invalid user data')
    );
    return await this.userRepository.create(userData);
  }

  public async findUserById(
    id: string,
    session?: MongoSession
  ): Promise<Optional<User>> {
    return this.userRepository.findById(id, { mongoOptions: { session } });
  }

  public async findOneBy(filter: Partial<User>): Promise<Optional<User>> {
    return this.userRepository.findOneBy(filter);
  }

  public async findAll(
    filter: Partial<User> | undefined = undefined
  ): Promise<User[]> {
    return this.userRepository.findAll(filter);
  }

  public async findUserByUsernameAndPassword(
    username: string,
    password: string
  ): Promise<Optional<User>> {
    if (commonUtils.isAnyEmpty(username, password)) {
      return Optional.empty();
    }

    const shaPassword = sha256(password);
    return this.userRepository.findOneBy({
      username,
      password: shaPassword
    });
  }

  public async findUserByUsername(username: string): Promise<Optional<User>> {
    if (commonUtils.isEmpty(username)) return Optional.empty();
    return this.userRepository.findOneBy({ username });
  }

  public async makeDeposit(id: string, deposit: Amount): Promise<User> {
    this.checkDeposit(deposit);

    const user: User = await this.getExpectedUserById(id);

    const newDeposit: Amount = {
      value: user.deposit.value + deposit.value,
      unit: deposit.unit,
      currency: deposit.currency
    };

    const updatedUser: Partial<User> = {
      ...user,
      deposit: newDeposit
    };

    Objects.requireTrue(
      commonUtils.isSafe(updatedUser),
      new BadRequestException('Invalid user data')
    );

    const update = await this.userRepository.update(id, <User>updatedUser, {
      locking: 'optimistic'
    });
    if (!update) throw new InternalServerException('Failed to make deposit');
    return { ...user, deposit: newDeposit };
  }

  public async resetDeposit(id: string): Promise<User> {
    const user: User = await this.getExpectedUserById(id);

    const newDeposit: Amount = {
      value: 0,
      unit: user.deposit.unit,
      currency: user.deposit.currency
    };

    const updatedUser: Partial<User> = {
      ...user,
      deposit: newDeposit
    };

    Objects.requireTrue(
      commonUtils.isSafe(updatedUser),
      new BadRequestException('Invalid user data')
    );

    const update = await this.userRepository.update(id, updatedUser, {
      locking: 'optimistic'
    });

    if (!update) throw new InternalServerException('Failed to reset deposit');
    return { ...user, deposit: newDeposit };
  }

  public async updateUser(
    id: string,
    request: Partial<UserRequest>,
    session?: MongoSession
  ): Promise<boolean> {
    Objects.requireNonEmpty(
      [id, request],
      new BadRequestException('Invalid user data')
    );

    const { password, deposit, role } = request;

    if (commonUtils.isNoneEmpty(password)) {
      throw new BadRequestException(
        'Password cannot be updated. Please use changePassword endpoint'
      );
    }

    if (commonUtils.isNoneEmpty(role)) {
      throw new BadRequestException(
        'Role cannot be updated. Please use updateRole endpoint'
      );
    }

    const existingUser = await this.getExpectedUserById(id, session);

    const updatedUser: Partial<User> = {
      ...existingUser,
      deposit: deposit || existingUser.deposit
    };

    Objects.requireTrue(
      commonUtils.isSafe(updatedUser),
      new BadRequestException('Invalid user data')
    );

    const update = await this.userRepository.update(id, updatedUser, {
      locking: 'optimistic',
      mongoOptions: { session }
    });

    if (!update) throw new InternalServerException('Failed to update user');
    return true;
  }

  public async updateRole(id: string, role: string): Promise<boolean> {
    logger.info('Updating user role:', { id, role });
    Objects.requireNonEmpty(
      [id, role],
      new BadRequestException('Invalid user data')
    );

    const [user, roleResult] = await Promise.all([
      this.getExpectedUserById(id),
      this.roleService.findRoleByName(role)
    ]);

    roleResult.orElseThrow(new NotFoundException('Role not found'));

    const updatedUser: Partial<User> = {
      ...user,
      roleId: roleResult.get().id
    };

    Objects.requireTrue(
      commonUtils.isSafe(updatedUser),
      new BadRequestException('Invalid user data')
    );

    const update = await this.userRepository.update(id, updatedUser, {
      locking: 'optimistic'
    });

    if (!update) throw new InternalServerException('Failed to update role');
    return true;
  }

  public async changePassword(id: string, password: string): Promise<boolean> {
    Objects.requireNonEmpty(
      [password, id],
      new BadRequestException('Invalid user data')
    );

    this.checkUsernameAndPassword('username', password);

    const user = await this.getExpectedUserById(id);

    const shaPassword = sha256(password);

    const updatedUser = { ...user, password: shaPassword };

    Objects.requireTrue(
      commonUtils.isSafe(updatedUser),
      new BadRequestException('Invalid user data')
    );

    return this.userRepository.update(id, updatedUser, {
      locking: 'optimistic'
    });
  }

  public async removeUser(id: string): Promise<boolean> {
    Objects.requireNonEmpty(id, new BadRequestException('Invalid userId'));

    await this.getExpectedUserById(id);
    return this.userRepository.remove(id);
  }

  private checkDeposit(deposit?: Amount): void {
    if (!deposit) {
      throw new BadRequestException('Invalid deposit');
    }

    const acceptedDepositAmounts = PurchaseService.SUPPORTED_DENOMINATIONS;
    if (!acceptedDepositAmounts.includes(deposit.value)) {
      throw new BadRequestException(
        `Invalid deposit. Only ${acceptedDepositAmounts.join(', ')} cent coins are allowed`
      );
    }
  }

  private async getExpectedUserById(
    id: string,
    session?: MongoSession
  ): Promise<User> {
    return (
      await this.userRepository.findById(id, { mongoOptions: { session } })
    ).orElseThrow(new NotFoundException('User not found'));
  }

  private checkUsernameAndPassword(username: string, password: string): void {
    Objects.requireTrue(
      [
        username.trim().length >= 5,
        username.trim().length <= 20,
        password.trim().length >= 6
      ],
      new BadRequestException(
        'Invalid username or password length (username: 5-20, password: 6+)'
      )
    );
  }
}

export { UserService };
