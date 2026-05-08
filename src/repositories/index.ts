import { PrismaTaskRepository } from './prisma/task.repository';
import { PrismaUserRepository } from './prisma/user.repository';
import { PrismaLocationRepository } from './prisma/location.repository';
import { PrismaBusinessRepository } from './prisma/business.repository';
import { PrismaCommentRepository } from './prisma/comment.repository';
import { PrismaCycleRepository } from './prisma/cycle.repository';
import { PrismaObjectiveRepository } from './prisma/objective.repository';
import { PrismaCalendarEventRepository } from './prisma/calendar-event.repository';

export const taskRepository = new PrismaTaskRepository();
export const userRepository = new PrismaUserRepository();
export const locationRepository = new PrismaLocationRepository();
export const businessRepository = new PrismaBusinessRepository();
export const commentRepository = new PrismaCommentRepository();
export const cycleRepository = new PrismaCycleRepository();
export const objectiveRepository = new PrismaObjectiveRepository();
export const calendarEventRepository = new PrismaCalendarEventRepository();
