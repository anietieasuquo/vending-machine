import {
  commonUtils,
  logger,
  Objects,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { Role } from '@main/types/store';
import { BadRequestException } from '@main/exception/BadRequestException';

class RoleService {
  public constructor(
    private readonly roleRepository: TransactionalCrudRepository<Role>
  ) {}

  public async createRole(role: Partial<Role>): Promise<Role> {
    logger.info('Creating role:', role);
    const { name, privileges } = role;
    Objects.requireNonEmpty(
      [name, privileges],
      new BadRequestException('Invalid role data')
    );

    (await this.roleRepository.findOneBy({ name })).ifPresentThrow(
      new BadRequestException('Role already exists')
    );

    Objects.requireTrue(
      commonUtils.isSafe(role),
      new BadRequestException('Invalid purchase data')
    );

    return await this.roleRepository.create(<Role>role);
  }

  public async createRoles(roles: Partial<Role>[]): Promise<Role[]> {
    logger.info('Creating roles:', roles);
    roles.forEach((role) => {
      const { name, privileges } = role;
      Objects.requireNonEmpty(
        [name, privileges],
        new BadRequestException('Invalid role data')
      );
    });

    Objects.requireTrue(
      commonUtils.isSafe(roles),
      new BadRequestException('Invalid purchase data')
    );

    return await this.roleRepository.createAll(<Role[]>roles);
  }

  public async findRoleById(id: string): Promise<Optional<Role>> {
    return this.roleRepository.findById(id);
  }

  public async getRoles(filter?: Partial<Role>): Promise<Role[]> {
    return this.roleRepository.findAll(filter);
  }

  public async findRoleByName(name: string): Promise<Optional<Role>> {
    return this.roleRepository.findOneBy({ name });
  }
}

export { RoleService };
