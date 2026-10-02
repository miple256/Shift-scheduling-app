CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `help_items` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`author_user_id` text NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `income_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`hourly_wage` integer DEFAULT 0 NOT NULL,
	`night_bonus` integer DEFAULT 0 NOT NULL,
	`holiday_bonus` integer DEFAULT 0 NOT NULL,
	`transportation_fee` integer DEFAULT 0 NOT NULL,
	`show_forecast` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `shift_swaps` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`counterpart_read_at` integer,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_user_date_type` ON `shifts` (`user_id`,`date`,`type`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`phone` text,
	`initial` text DEFAULT '?' NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
