import { relations } from 'drizzle-orm';
import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const trainingSession = pgTable('training_session', {
  id: uuid('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activity = pgTable('activity', {
  id: text('id').primaryKey(),
  module: text('module').notNull(),
  name: text('name').notNull(),
});

export const activityCompletion = pgTable(
  'activity_completion',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => trainingSession.id, { onDelete: 'cascade' }),
    activityId: text('activity_id')
      .notNull()
      .references(() => activity.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.activityId] })],
);

export const trainingSessionRelations = relations(
  trainingSession,
  ({ many }) => ({
    completions: many(activityCompletion),
  }),
);

export const activityRelations = relations(activity, ({ many }) => ({
  completions: many(activityCompletion),
}));

export const activityCompletionRelations = relations(
  activityCompletion,
  ({ one }) => ({
    session: one(trainingSession, {
      fields: [activityCompletion.sessionId],
      references: [trainingSession.id],
    }),
    activity: one(activity, {
      fields: [activityCompletion.activityId],
      references: [activity.id],
    }),
  }),
);
