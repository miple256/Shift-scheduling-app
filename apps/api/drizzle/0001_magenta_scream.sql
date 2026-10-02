PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_help_items` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`author_user_id` text NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_help_items`("id", "question", "answer", "author_user_id", "approved", "created_at") SELECT "id", "question", "answer", "author_user_id", "approved", "created_at" FROM `help_items`;--> statement-breakpoint
DROP TABLE `help_items`;--> statement-breakpoint
ALTER TABLE `__new_help_items` RENAME TO `help_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_shift_swaps` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`counterpart_read_at` integer,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_shift_swaps`("id", "date", "type", "start_time", "end_time", "from_user_id", "to_user_id", "created_at", "counterpart_read_at") SELECT "id", "date", "type", "start_time", "end_time", "from_user_id", "to_user_id", "created_at", "counterpart_read_at" FROM `shift_swaps`;--> statement-breakpoint
DROP TABLE `shift_swaps`;--> statement-breakpoint
ALTER TABLE `__new_shift_swaps` RENAME TO `shift_swaps`;