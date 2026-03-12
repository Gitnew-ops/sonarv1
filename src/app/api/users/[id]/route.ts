import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/users/[id] - Get a specific user
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

    // Only admin can view other users, or user can view themselves
    if (!isAdmin(session) && session.id !== id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            campaigns: true,
            emails: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
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
    const { name, email, password, role, isActive } = body;

    // Only admin can update other users, or user can update themselves (limited)
    const isSelf = session.id === id;
    const isAuthorized = isAdmin(session) || isSelf;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (name) updateData.name = name;
    
    // Email change validation
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    // Password change
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Role change - admin only
    if (role !== undefined) {
      if (!isAdmin(session)) {
        return NextResponse.json(
          { error: 'Apenas administradores podem alterar o papel do usuário' },
          { status: 403 }
        );
      }
      if (role !== 'ADMIN' && role !== 'USER') {
        return NextResponse.json(
          { error: 'Papel inválido. Use ADMIN ou USER' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // isActive change - admin only
    if (isActive !== undefined) {
      if (!isAdmin(session)) {
        return NextResponse.json(
          { error: 'Apenas administradores podem alterar o status do usuário' },
          { status: 403 }
        );
      }
      // Prevent admin from deactivating themselves
      if (isSelf && !isActive) {
        return NextResponse.json(
          { error: 'Não é possível desativar sua própria conta' },
          { status: 400 }
        );
      }
      updateData.isActive = isActive;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (session.id === id) {
      return NextResponse.json(
        { error: 'Não é possível excluir sua própria conta' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}
