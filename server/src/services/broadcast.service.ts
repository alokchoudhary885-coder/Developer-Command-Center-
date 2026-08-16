import { io } from '../server';

export interface BroadcastActivityPayload {
  type: string;
  action: string;
  title: string;
  description?: string;
  actor: string;
  actorAvatar?: string;
  repositoryId?: string;
  repositoryName?: string;
  userId?: string;
  timestamp: string;
  metadata?: any;
}

export class BroadcastService {
  /**
   * Broadcast real-time activity stream to all connected dashboards
   */
  static emitActivity(activity: BroadcastActivityPayload) {
    try {
      if (io) {
        console.log(`⚡ [BroadcastService] Emitting ${activity.type}:${activity.action} to global stream`);
        io.emit('activity_stream', activity);

        if (activity.repositoryId) {
          io.to(`repo:${activity.repositoryId}`).emit('repo_activity', activity);
        }

        if (activity.userId) {
          io.to(`user:${activity.userId}`).emit('user_activity', activity);
        }
      }
    } catch (err) {
      console.error('❌ [BroadcastService] Error emitting event:', err);
    }
  }

  /**
   * Emit event to a specific repository room
   */
  static emitToRepository(repositoryId: string, event: string, payload: any) {
    try {
      if (io) {
        io.to(`repo:${repositoryId}`).emit(event, payload);
      }
    } catch (err) {
      console.error(`❌ [BroadcastService] Error emitting to repo:${repositoryId}:`, err);
    }
  }

  /**
   * Emit event to a specific user room
   */
  static emitToUser(userId: string, event: string, payload: any) {
    try {
      if (io) {
        io.to(`user:${userId}`).emit(event, payload);
      }
    } catch (err) {
      console.error(`❌ [BroadcastService] Error emitting to user:${userId}:`, err);
    }
  }
}
