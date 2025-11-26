import { SqlToolkit } from "langchain/agents/toolkits/sql";
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { llm } from "../config/llm";
import dotenv from "dotenv";

dotenv.config();

const datasource = new DataSource({
  type: "postgres",
  host: "aws-0-us-east-2.pooler.supabase.com", // Tu Host de Supabase
  port: 5432,
  username: "postgres.ciabpuxanqqzgozqqjtx",
  password: process.env.SUPABASE_PASSWORD,
  database: "postgres",
  synchronize: false,
  logging: false,
});
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
});

const toolkit = new SqlToolkit(db, llm);
export const sqlTools = toolkit.getTools();
