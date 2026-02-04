const db = require('../config/db');

/**
 * Base Model class providing common database operations
 */
class BaseModel {
    constructor(tableName, primaryKey = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    /**
     * Find all records with optional filters
     * @param {Object} filters - WHERE conditions
     * @param {Object} options - { orderBy, limit, offset }
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}, options = {}) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const values = [];
            let paramCount = 1;

            // Add WHERE conditions
            if (Object.keys(filters).length > 0) {
                const conditions = Object.keys(filters).map(key => {
                    values.push(filters[key]);
                    return `${key} = $${paramCount++}`;
                });
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            // Add ORDER BY
            if (options.orderBy) {
                query += ` ORDER BY ${options.orderBy}`;
            }

            // Add LIMIT
            if (options.limit) {
                query += ` LIMIT $${paramCount++}`;
                values.push(options.limit);
            }

            // Add OFFSET
            if (options.offset) {
                query += ` OFFSET $${paramCount++}`;
                values.push(options.offset);
            }

            const result = await db.query(query, values);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a single record by ID
     * @param {Number} id - Primary key value
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find a single record by filters
     * @param {Object} filters - WHERE conditions
     * @returns {Promise<Object|null>}
     */
    async findOne(filters) {
        try {
            const records = await this.findAll(filters, { limit: 1 });
            return records[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new record
     * @param {Object} data - Record data
     * @param {Object} client - Optional database client for transactions
     * @returns {Promise<Object>}
     */
    async create(data, client = null) {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

            const query = `
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

            const executor = client || db;
            const result = await executor.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a record by ID
     * @param {Number} id - Primary key value
     * @param {Object} data - Updated data
     * @param {Object} client - Optional database client for transactions
     * @returns {Promise<Object|null>}
     */
    async update(id, data, client = null) {
        try {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

            const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.primaryKey} = $${keys.length + 1}
        RETURNING *
      `;

            const executor = client || db;
            const result = await executor.query(query, [...values, id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a record by ID
     * @param {Number} id - Primary key value
     * @param {Object} client - Optional database client for transactions
     * @returns {Promise<Boolean>}
     */
    async delete(id, client = null) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
            const executor = client || db;
            const result = await executor.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // ... count method skipped as it's usually read-only ...

    /**
     * Execute a custom query
     * @param {String} query - SQL query
     * @param {Array} values - Query parameters
     * @param {Object} client - Optional database client for transactions
     * @returns {Promise<Object>}
     */
    async executeQuery(query, values = [], client = null) {
        try {
            const executor = client || db;
            return await executor.query(query, values);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BaseModel;
