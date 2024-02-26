import { commonUtils, CrudRepository, logger } from 'tspa';
import { Role } from '@main/types/store';

class RoleService {
  public constructor(private readonly roleRepository: CrudRepository<Role>) {}

  public async createRole(role: Partial<Role>): Promise<Role> {
    logger.info('Creating role:', role);
    const { name, privileges } = role;

    if (commonUtils.isAnyEmpty(name, privileges)) {
      throw new Error('Invalid role data');
    }

    const existingRole: Role | undefined = await this.roleRepository.findOneBy({
      name: name!
    });

    if (existingRole) {
      logger.error('Role already exists');
      throw new Error('Role already exists');
    }

    logger.debug('Role does not exist');
    const newRole: Role | undefined = await this.roleRepository.create(
      <Role>role
    );
    if (!newRole) {
      logger.error('Failed to create role');
      throw new Error('Failed to create role');
    }
    return newRole;
  }

  public async findRoleById(id: string): Promise<Role | undefined> {
    return this.roleRepository.findById(id);
  }

  public async findRoleByName(name: string): Promise<Role | undefined> {
    return this.roleRepository.findOneBy({ name });
  }
}

export { RoleService };
