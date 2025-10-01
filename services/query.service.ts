import TableSchema from "../constants/table.constant";

export default class QueryService {
    public static init(): string {
        return this.create(...Object.keys(TableSchema));
    }

    public static setDefaults(): string {
        let query = "";
        let columns: string[] = [];
        let values: number[] = [];

        query += `INSERT INTO counters (@columns) values (@values);`;
        Object.keys(TableSchema.counters).forEach((column) => {
            columns.push(column);
            values.push(0);
        });
        query = query.replace("@columns", columns.join(",")).replace("@values", values.join(","));

        return query;
    }

    public static create(...tables: string[]): string {
        let query = "";

        tables.forEach((table) => {
            const schema = TableSchema[table];
            const columns = Object.keys(schema).map((key) => [key, schema[key].type, schema[key].constraints.join(" ")].join(" "));
            query += `CREATE TABLE IF NOT EXISTS ${table} (${columns});`;
        });

        return query;
    }

    public static list(table: string, column?: string, direction: "ASC" | "DESC" = "DESC"): string {
        const orderBy = column ? `ORDER BY ${column} ${direction}` : "";
        return `SELECT * from ${table} ${orderBy}`;
    }
}
