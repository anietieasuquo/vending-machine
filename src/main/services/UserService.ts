import { commonUtils, CrudRepository, logger } from 'tspa';
import { Amount, User } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import { sha256 } from '@main/util/commons';
import { RoleService } from '@main/services/RoleService';
import { PurchaseService } from '@main/services/PurchaseService';
import { UserDto, UserRequest } from '@main/types/dto';
import { fromUserToUserDto } from '@main/util/mapper';
import { TokenService } from '@main/services/TokenService';

class UserService {
  public constructor(
    private readonly userRepository: CrudRepository<User>,
    private readonly roleService: RoleService,
    private readonly tokenService: TokenService
  ) {}

  public async createUser(request: UserRequest): Promise<UserDto> {
    const { username, password, deposit, roleId, machineId } = request;

    if (
      commonUtils.isAnyEmpty(
        username,
        password,
        deposit?.value,
        roleId,
        machineId
      )
    ) {
      throw new Error('Invalid user data, cannot be serviced');
    }

    this.checkDeposit(deposit!);

    const client = await this.tokenService.findSecretById(machineId);
    if (!client) throw new NotFoundException('Machine not found');

    const role = await this.roleService.findRoleById(roleId!);
    if (!role) throw new NotFoundException('Role not found');

    const existingUser = await this.findUserByUsername(username!);
    if (existingUser) {
      logger.error('User already exists');
      throw new Error('User already exists');
    }

    logger.debug('User does not exist');
    const shaPassword = sha256(password!);

    logger.debug('Creating user');
    const newUser: User | undefined = await this.userRepository.create(<User>{
      username,
      deposit,
      roleId,
      password: shaPassword,
      machineId
    });

    if (!newUser) {
      logger.error('Failed to create user');
      throw new Error('Failed to create user');
    }

    return fromUserToUserDto(newUser);
  }

  public async findUserById(id: string): Promise<UserDto | undefined> {
    const user = await this.userRepository.findById(id);
    if (!user) return undefined;
    return fromUserToUserDto(user);
  }

  public async findBy(filter: Partial<User>): Promise<UserDto | undefined> {
    const user = await this.userRepository.findOneBy(filter);
    if (!user) return undefined;
    return fromUserToUserDto(user);
  }

  public async findUserByUsernameAndPassword(
    username: string,
    password: string
  ): Promise<UserDto | undefined> {
    if (commonUtils.isAnyEmpty(username, password)) {
      throw new Error('Invalid user data');
    }

    const shaPassword = sha256(password);
    const user = await this.userRepository.findOneBy({
      username,
      password: shaPassword
    });
    if (!user) return undefined;
    return fromUserToUserDto(user);
  }

  public async findUserByUsername(
    username: string
  ): Promise<UserDto | undefined> {
    if (commonUtils.isEmpty(username)) throw new Error('Invalid user data');
    const user = await this.userRepository.findOneBy({ username });
    if (!user) return undefined;
    return fromUserToUserDto(user);
  }

  public async makeDeposit(id: string, deposit: Amount): Promise<boolean> {
    this.checkDeposit(deposit);

    const user: UserDto | undefined = await this.findUserById(id);
    if (!user) throw new NotFoundException('User not found');

    const newDeposit: Amount = {
      value: user.deposit.value + deposit.value,
      unit: deposit.unit,
      currency: deposit.currency
    };

    const updatedUser: Partial<User> = {
      deposit: newDeposit
    };
    const update = await this.userRepository.update(id, <User>updatedUser);
    if (!update) throw new Error('Failed to make deposit');
    return true;
  }

  public async updateUser(
    id: string,
    request: Partial<UserRequest>
  ): Promise<boolean> {
    if (commonUtils.isAnyEmpty(id, request)) {
      throw new Error('Invalid user data');
    }

    const { username, password, deposit, roleId } = request;

    if (!commonUtils.isEmpty(password)) {
      throw new Error(
        'Password cannot be updated. Please use changePassword endpoint'
      );
    }

    if (!commonUtils.isEmpty(roleId)) {
      const role = await this.roleService.findRoleById(roleId!);
      if (!role) throw new NotFoundException('Role not found');
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) throw new NotFoundException('User not found');

    const updatedUser: User = {
      ...existingUser,
      username: username || existingUser.username,
      deposit: deposit || existingUser.deposit,
      roleId: roleId || existingUser.roleId
    };
    const update = await this.userRepository.update(id, updatedUser);
    if (!update) throw new Error('Failed to update user');
    return true;
  }

  public async changePassword(id: string, password: string): Promise<boolean> {
    if (commonUtils.isAnyEmpty(id, password)) {
      throw new Error('Invalid user data');
    }

    const shaPassword = sha256(password);
    return await this.userRepository.update(id, { password: shaPassword });
  }

  public async removeUser(id: string): Promise<boolean> {
    if (commonUtils.isEmpty(id)) throw new Error('Invalid userId');
    return this.userRepository.remove(id);
  }

  public async isValidUser(username: string): Promise<boolean> {
    if (commonUtils.isEmpty(username)) throw new Error('Invalid user data');
    return (await this.findUserByUsername(username)) !== undefined;
  }

  private checkDeposit(deposit: Amount): void {
    const acceptedDepositAmounts = PurchaseService.SUPPORTED_DENOMINATIONS;
    if (!acceptedDepositAmounts.includes(deposit.value)) {
      throw new Error(
        `Invalid deposit. Only ${acceptedDepositAmounts.join(', ')} cent coins are allowed`
      );
    }
  }
}

export { UserService };
