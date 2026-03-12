import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const company = await db.company.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vessels: {
          orderBy: { createdAt: 'desc' }
        },
        emails: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            campaign: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            vessels: true,
            emails: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresa' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update a company
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      email,
      phone,
      country,
      city,
      website,
      status,
      score,
      notes,
      lastContact
    } = body;

    // Check if company exists
    const existingCompany = await db.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      type?: string;
      email?: string;
      phone?: string;
      country?: string;
      city?: string;
      website?: string;
      status?: string;
      score?: number;
      notes?: string;
      lastContact?: Date;
    } = {};

    if (name) updateData.name = name;

    if (type) {
      const validTypes = ['SHIPOWNER', 'ARMADOR', 'BROKER', 'AGENT'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Tipo inválido. Use: SHIPOWNER, ARMADOR, BROKER ou AGENT' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (website !== undefined) updateData.website = website;

    if (status) {
      const validStatuses = ['NEW', 'QUALIFIED', 'CONTACTED', 'RESPONDED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido. Use: NEW, QUALIFIED, CONTACTED, RESPONDED ou CLOSED' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (score !== undefined) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'Score deve ser um número entre 0 e 100' },
          { status: 400 }
        );
      }
      updateData.score = score;
    }

    if (notes !== undefined) updateData.notes = notes;
    if (lastContact !== undefined) updateData.lastContact = new Date(lastContact);

    const company = await db.company.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      message: 'Empresa atualizada com sucesso',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar empresa' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if company exists
    const existingCompany = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vessels: true,
            emails: true
          }
        }
      }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Delete related records first (vessels and emails)
    await db.$transaction([
      db.vessel.deleteMany({ where: { companyId: id } }),
      db.email.deleteMany({ where: { companyId: id } }),
      db.company.delete({ where: { id } })
    ]);

    return NextResponse.json({
      message: 'Empresa excluída com sucesso'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir empresa' },
      { status: 500 }
    );
  }
}
