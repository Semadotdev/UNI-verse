import { NextResponse } from 'next/server';
import { initializeBuiltinProviders } from '@/infrastructure/providers/initialize';

export async function GET() {
  try {
    await initializeBuiltinProviders();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
