import { NextApiRequest, NextApiResponse } from 'next';
import { Task } from '@/lib/tasks';
import { logTask } from '@/lib/taskRun';

export default function runHandler(request: NextApiRequest, response: NextApiResponse) {
  const body = JSON.parse(request.body);
  if (!body.servers || !body.tasks) {
    console.error(`Invalid JSON:\n${request.body}`);
    response
      .status(400)
      .send(`Missing required paramters`);
    response
      .end();
  }

  response
    .status(200)
    .end();

  console.log(`tasks:`, body.tasks);
  console.log(`servers:`, body.servers);

  for (const serverId of body.servers) {
    for (const task of body.tasks) {
      if (Math.random() > 0.7) {
        if (task.taskName === 'ScheduleActivate') {
          logTask(serverId, 'error', `Task ${task.properties.scheduleName} not found`);
        } else {
          logTask(serverId, 'error', `${task.taskName} failed`);
        }
        break;
      } else {
        logTask(serverId, 'info', `Executed ${task.taskName}`);
      }
    }
  }

  body.servers.forEach((serverId: string) => {
    logTask(serverId, 'completed');
  });
}
