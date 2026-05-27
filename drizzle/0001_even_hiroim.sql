ALTER TABLE "room_players" DROP CONSTRAINT "room_players_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_host_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "room_players" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "host_id" SET DATA TYPE text;