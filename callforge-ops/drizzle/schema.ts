import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Virtual Number Management Table
 * Stores provisioned virtual phone numbers, telecom carrier bindings,
 * AI agent routing configurations, and health validation stats.
 */
export const virtualNumbers = mysqlTable("virtual_numbers", {
  id: varchar("id", { length: 100 }).primaryKey(),
  phoneNumber: varchar("phone_number", { length: 30 }).notNull().unique(),
  friendlyName: varchar("friendly_name", { length: 150 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "pending_validation", "error"]).default("active").notNull(),
  type: mysqlEnum("type", ["inbound", "outbound", "bidirectional"]).default("bidirectional").notNull(),
  capabilities: json("capabilities"),
  assignedAgentId: varchar("assigned_agent_id", { length: 100 }).default("agent_aarogya_dental"),
  inboundRouting: json("inbound_routing"),
  providerConfig: json("provider_config"),
  webhookUrl: text("webhook_url"),
  isDefaultOutbound: boolean("is_default_outbound").default(false).notNull(),
  stats: json("stats"),
  validation: json("validation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VirtualNumberRecord = typeof virtualNumbers.$inferSelect;
export type InsertVirtualNumber = typeof virtualNumbers.$inferInsert;
