import { pgTable, serial, varchar, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const wardrobes = pgTable(
	"wardrobes",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		layout: jsonb("layout").notNull().default(sql`'{"rows":2,"cols":3,"slots":[]}'::jsonb`),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("wardrobes_created_at_idx").on(table.created_at),
	]
);

export const clothes = pgTable(
	"clothes",
	{
		id: serial().primaryKey(),
		wardrobe_id: integer("wardrobe_id").notNull().references(() => wardrobes.id, { onDelete: "cascade" }),
		slot_id: varchar("slot_id", { length: 50 }),
		name: varchar("name", { length: 200 }).notNull(),
		type: varchar("type", { length: 50 }).notNull().default("other"),
		season: varchar("season", { length: 20 }).notNull().default("all"),
		image_key: varchar("image_key", { length: 500 }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("clothes_wardrobe_id_idx").on(table.wardrobe_id),
		index("clothes_slot_id_idx").on(table.slot_id),
		index("clothes_type_idx").on(table.type),
		index("clothes_season_idx").on(table.season),
	]
);

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertWardrobeSchema = createCoercedInsertSchema(wardrobes).pick({ name: true, layout: true });
export const insertClothSchema = createCoercedInsertSchema(clothes).pick({ wardrobe_id: true, slot_id: true, name: true, type: true, season: true, image_key: true });

export type Wardrobe = typeof wardrobes.$inferSelect;
export type InsertWardrobe = typeof wardrobes.$inferInsert;
export type Cloth = typeof clothes.$inferSelect;
export type InsertCloth = typeof clothes.$inferInsert;
