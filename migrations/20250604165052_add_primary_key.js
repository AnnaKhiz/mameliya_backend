/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
	await knex.schema.renameTable('users', 'users_old');

	await knex.schema.createTable('users', table => {
		table.string('first_name', 255).nullable();
		table.string('last_name', 255).nullable();
		table.string('email', 255).notNullable();
		table.string('password', 255).notNullable();
		table.string('userId', 266).notNullable().primary();
		table.integer('age', 2).nullable();
	});

	await knex('users').insert(knex.select('*').from('users_old'));

	await knex.schema.dropTable('users_old');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
	await knex.schema.renameTable('users', 'users_new');
	await knex.schema.createTable('users', table => {
		table.string('first_name', 255).notNullable();
		table.string('last_name', 255).notNullable();
		table.string('email', 255).notNullable();
		table.string('password', 255).notNullable();
		table.string('userId', 266).nullable();
		table.integer('age', 2).nullable();
	});
	await knex.schema.dropTable('users_new');
};
