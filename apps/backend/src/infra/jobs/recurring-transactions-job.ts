import type { FastifyInstance } from 'fastify';
import { createTask } from 'node-cron';
import { RecurringTransactionsGenerator } from '@/application/services/recurring-transactions-generator';
import { RECURRENCE_TIMEZONE } from '@/application/services/recurrence-day';

export function registerRecurringTransactionsJob(app: FastifyInstance, generator: RecurringTransactionsGenerator): void {
  let running = Promise.resolve();
  const task = createTask('0 1 * * *', () => {
    running = (async () => {
      try {
        const result = await generator.generateDue((err, recurrenceId) => {
          app.log.error({ err, recurrenceId }, 'Falha ao gerar recorrência; será tentada novamente no próximo dia');
        });
        app.log.info(result, 'Geração diária de recorrências concluída');
      } catch (err) {
        app.log.error({ err }, 'Falha na geração diária de recorrências');
      }
    })();
    return running;
  }, {
    name: 'recurring-transactions',
    timezone: RECURRENCE_TIMEZONE,
    noOverlap: true,
    missedExecutionTolerance: 5 * 60_000,
  });

  app.addHook('onReady', async () => { await task.start(); });
  app.addHook('onClose', async () => {
    await task.destroy();
    // O banco só deve ser desconectado depois do processamento em andamento.
    await running;
  });
}
