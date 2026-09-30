import { query } from '../db.js';
import { KnowledgeArticle } from '../../src/types.js';

export interface KnowledgeArticleRow {
  id: string;
  code: string;
  title: string;
  sector: string;
  category: string;
  service_type: string;
  summary_solution: string;
  detailed_procedure: string[];
  estimated_resolution_minutes: number;
  tags: string[];
  useful_count: number;
  author: string;
  last_updated: string;
  created_at: string;
}

function mapRowToArticle(row: any): KnowledgeArticle {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    sector: row.sector,
    serviceType: row.service_type || 'Geral',
    category: row.category,
    summarySolution: row.summary_solution,
    detailedProcedure: Array.isArray(row.detailed_procedure)
      ? row.detailed_procedure
      : typeof row.detailed_procedure === 'string'
      ? JSON.parse(row.detailed_procedure || '[]')
      : [],
    estimatedResolutionMinutes: row.estimated_resolution_minutes || 15,
    tags: Array.isArray(row.tags)
      ? row.tags
      : typeof row.tags === 'string'
      ? JSON.parse(row.tags || '[]')
      : [],
    usefulCount: row.useful_count || 0,
    lastUpdated: row.last_updated ? new Date(row.last_updated).toLocaleDateString('pt-BR') : '16/09/2026',
    author: row.author || 'Especialista GIHS'
  };
}

export const knowledgeRepository = {
  async findAll(sector?: string, category?: string): Promise<KnowledgeArticle[]> {
    let sql = 'SELECT * FROM knowledge_articles';
    const params: any[] = [];
    const conditions: string[] = [];

    if (sector && sector !== 'TODOS') {
      params.push(sector);
      conditions.push(`sector = $${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY useful_count DESC, id ASC;';

    const res = await query<any>(sql, params);
    return res.rows.map(mapRowToArticle);
  },

  async findById(id: string): Promise<KnowledgeArticle | null> {
    const res = await query<any>('SELECT * FROM knowledge_articles WHERE id = $1 LIMIT 1;', [id]);
    if (!res.rows[0]) return null;
    return mapRowToArticle(res.rows[0]);
  },

  async count(): Promise<number> {
    const res = await query<{ count: string }>('SELECT count(*) as count FROM knowledge_articles;');
    return parseInt(res.rows[0]?.count || '0', 10);
  },

  async create(article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const id = article.id || `KB-${Date.now().toString().slice(-6)}`;
    const code = article.code || `KB-${Math.floor(100 + Math.random() * 900)}`;

    const res = await query<any>(`
      INSERT INTO knowledge_articles (
        id, code, title, sector, category, service_type,
        summary_solution, detailed_procedure, estimated_resolution_minutes,
        tags, useful_count, author
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8::jsonb, $9,
        $10::jsonb, $11, $12
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        summary_solution = EXCLUDED.summary_solution,
        detailed_procedure = EXCLUDED.detailed_procedure,
        tags = EXCLUDED.tags,
        useful_count = EXCLUDED.useful_count
      RETURNING *;
    `, [
      id,
      code,
      article.title || 'Novo Artigo de Conhecimento',
      article.sector || 'N1',
      article.category || 'Acessos & Identidade',
      article.serviceType || 'Geral',
      article.summarySolution || '',
      JSON.stringify(article.detailedProcedure || []),
      article.estimatedResolutionMinutes || 15,
      JSON.stringify(article.tags || []),
      article.usefulCount || 0,
      article.author || 'Especialista GIHS'
    ]);

    return mapRowToArticle(res.rows[0]);
  },

  async incrementUseful(id: string): Promise<KnowledgeArticle | null> {
    const res = await query<any>(`
      UPDATE knowledge_articles
      SET useful_count = useful_count + 1
      WHERE id = $1
      RETURNING *;
    `, [id]);
    if (!res.rows[0]) return null;
    return mapRowToArticle(res.rows[0]);
  },

  async seedIfEmpty(articles: KnowledgeArticle[]): Promise<number> {
    const total = await this.count();
    if (total > 0) return total;

    for (const a of articles) {
      await this.create(a);
    }
    return articles.length;
  }
};
