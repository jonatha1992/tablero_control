import { PrismaTaskRepository } from './prisma/task.repository';
import { PrismaUserRepository } from './prisma/user.repository';
import { PrismaTeamRepository } from './prisma/team.repository';
import { PrismaLocationRepository } from './prisma/location.repository';
import { PrismaBusinessRepository } from './prisma/business.repository';

export const taskRepository = new PrismaTaskRepository();
export const userRepository = new PrismaUserRepository();
export const teamRepository = new PrismaTeamRepository();
export const locationRepository = new PrismaLocationRepository();
export const businessRepository = new PrismaBusinessRepository();
