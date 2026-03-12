import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createUser } from '@/lib/auth';

export async function POST() {
  try {
    // Check if any admin exists
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' }
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Já existe um administrador no sistema' },
        { status: 400 }
      );
    }

    // Create default admin user
    const admin = await createUser(
      'admin@sonar.ao',
      'admin123',
      'Administrador',
      'ADMIN'
    );

    return NextResponse.json({
      success: true,
      message: 'Administrador criado com sucesso',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' }
    });

    return NextResponse.json({
      needsSetup: adminCount === 0
    });
  } catch (error) {
    console.error('Check setup error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar configuração' },
      { status: 500 }
    );
  }
}
