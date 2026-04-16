// Singletons de repositorios — para cambiar de Firebase a otro backend,
// solo cambiar las clases importadas aquí. Nada más en el código cambia.
import { FirebaseTaskRepository } from './firebase/task.repository';
import { FirebaseUserRepository } from './firebase/user.repository';
import { FirebaseTeamRepository } from './firebase/team.repository';
import { FirebaseLocationRepository } from './firebase/location.repository';

export const taskRepository = new FirebaseTaskRepository();
export const userRepository = new FirebaseUserRepository();
export const teamRepository = new FirebaseTeamRepository();
export const locationRepository = new FirebaseLocationRepository();
