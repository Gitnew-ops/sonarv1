/**
 * ===========================================
 * SONAR V 1.0 - API de Discovery
 * ===========================================
 * 
 * Motor de descoberta de empresas marítimas
 * Usa AI para buscar, qualificar e salvar leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { searchMaritimeCompanies, scoreLead } from '@/lib/ai';
import { 
  runDiscoveryScan, 
  getDiscoveryStats, 
  SEARCH_QUERIES,
  type DiscoveryResult 
} from '@/lib/discovery-service';

/**
 * GET /api/discovery - Obter status e histórico de discovery
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obter empresas descobertas nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompanies = await db.company.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Obter estatísticas
    const stats = await getDiscoveryStats();

    // Obter último scan
    const lastScanSetting = await db.setting.findUnique({
      where: { key: 'last_discovery_scan' },
    });

    const lastScan = lastScanSetting ? JSON.parse(lastScanSetting.value) : null;

    return NextResponse.json({
      recentDiscoveries: recentCompanies,
      statistics: {
        totalNew: stats.totalNew,
        totalQualified: stats.totalQualified,
        averageScore: stats.averageScore,
        topCompanies: stats.topCompanies,
        lastScan: lastScan,
        discoveryQueries: SEARCH_QUERIES
      }
    });
  } catch (error) {
    console.error('Get discovery error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar descobertas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/discovery - Executar processo de discovery
 * 
 * Body (opcional):
 * - queries: string[] - Queries personalizadas de busca
 * - autoScore: boolean - Pontuar automaticamente (default: true)
 * - saveToDb: boolean - Salvar no banco (default: true)
 * - useService: boolean - Usar serviço de discovery completo (default: false)
 */
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INFO] [DISCOVERY] Iniciando processo de discovery`);

  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { 
      queries, 
      autoScore = true, 
      saveToDb = true,
      useService = false 
    } = body;

    // Se usar o serviço completo de discovery
    if (useService) {
      console.log(`[${timestamp}] [INFO] [DISCOVERY] Usando serviço de discovery completo`);
      
      const result = await runDiscoveryScan();
      
      return NextResponse.json({
        message: 'Descoberta concluída',
        summary: {
          totalFound: result.totalFound,
          newCompanies: result.newCompanies,
          duplicates: result.duplicates,
          errorCount: result.errors.length
        },
        companies: result.companies,
        errors: result.errors.length > 0 ? result.errors : undefined,
        timestamp
      }, { status: 201 });
    }

    // Usar queries personalizadas ou as padrão
    const searchQueries = queries && queries.length > 0 ? queries : SEARCH_QUERIES;

    console.log(`[${timestamp}] [INFO] [DISCOVERY] Queries: ${searchQueries.join(', ')}`);

    const results: DiscoveryResult = {
      totalFound: 0,
      newCompanies: 0,
      duplicates: 0,
      errors: [],
      companies: []
    };

    // Processar cada query de busca
    for (const query of searchQueries) {
      try {
        console.log(`[${timestamp}] [INFO] [DISCOVERY] Buscando: "${query}"`);
        
        const companies = await searchMaritimeCompanies(query);
        results.totalFound += companies.length;

        console.log(`[${timestamp}] [INFO] [DISCOVERY] Encontradas ${companies.length} empresas para "${query}"`);

        for (const companyData of companies) {
          try {
            // Verificar se empresa já existe
            const existingCompany = await db.company.findFirst({
              where: {
                OR: [
                  { name: { equals: companyData.name, mode: 'insensitive' } },
                  { website: companyData.website },
                  { email: companyData.email }
                ].filter(Boolean)
              }
            });

            if (existingCompany) {
              results.duplicates++;
              continue;
            }

            // Calcular score do lead
            let score = 0;
            if (autoScore) {
              const leadScore = await scoreLead(companyData);
              score = leadScore.score;
            }

            // Salvar no banco se habilitado
            if (saveToDb) {
              const company = await db.company.create({
                data: {
                  name: companyData.name,
                  type: companyData.type,
                  email: companyData.email,
                  phone: companyData.phone,
                  country: companyData.country || 'Angola',
                  city: companyData.city,
                  website: companyData.website,
                  status: 'NEW',
                  score,
                  notes: companyData.snippet,
                  createdById: session.id
                }
              });

              results.companies.push({
                id: company.id,
                name: company.name,
                type: company.type,
                email: company.email || undefined,
                phone: company.phone || undefined,
                country: company.country || undefined,
                city: company.city || undefined,
                website: company.website || undefined,
                score: company.score,
                snippet: company.notes || undefined
              });
              results.newCompanies++;
            } else {
              results.companies.push({
                ...companyData,
                score
              });
              results.newCompanies++;
            }
          } catch (companyError: any) {
            console.error(`[${timestamp}] [ERROR] [DISCOVERY] Erro ao processar ${companyData.name}:`, companyError);
            results.errors.push(`Erro ao processar ${companyData.name}: ${companyError.message}`);
          }
        }

        // Delay entre buscas para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (searchError: any) {
        console.error(`[${timestamp}] [ERROR] [DISCOVERY] Erro na busca "${query}":`, searchError);
        results.errors.push(`Erro na busca "${query}": ${searchError.message}`);
      }
    }

    // Registrar execução no banco
    await db.setting.upsert({
      where: { key: 'last_discovery_scan' },
      create: {
        key: 'last_discovery_scan',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFound: results.totalFound,
          newCompanies: results.newCompanies,
          duplicates: results.duplicates,
          errorCount: results.errors.length,
          triggeredBy: session.id
        }),
        description: 'Último scan de discovery executado'
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFound: results.totalFound,
          newCompanies: results.newCompanies,
          duplicates: results.duplicates,
          errorCount: results.errors.length,
          triggeredBy: session.id
        })
      }
    });

    console.log(`[${timestamp}] [INFO] [DISCOVERY] Concluído: ${results.newCompanies} novas empresas`);

    return NextResponse.json({
      message: 'Descoberta concluída',
      summary: {
        totalFound: results.totalFound,
        newCompanies: results.newCompanies,
        duplicates: results.duplicates,
        errorCount: results.errors.length
      },
      companies: results.companies,
      errors: results.errors.length > 0 ? results.errors : undefined,
      timestamp
    }, { status: 201 });
  } catch (error) {
    console.error(`[${timestamp}] [ERROR] [DISCOVERY] Erro no processo:`, error);
    return NextResponse.json(
      { error: 'Erro no processo de descoberta', timestamp },
      { status: 500 }
    );
  }
}
