/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	return knex.schema.createTable('mama_about', (table) => {
		table.increments().primary();
		table.string('mood', 255).notNullable().defaultTo('good');
		table.boolean('hasRituals').notNullable().defaultTo(false);
		table.boolean('isTimerUsed').notNullable().defaultTo(false);
		table.integer('timer').notNullable().defaultTo(5);

		table.string('userId').notNullable()
			.references('userId')
			.inTable('users')
			.onDelete('CASCADE')
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
	return knex.schema.dropTableIfExists('mama_about');
};
