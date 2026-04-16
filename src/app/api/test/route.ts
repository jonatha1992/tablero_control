import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Attempt to write a test document
    const docRef = db.collection('test').doc('backend-test');
    await docRef.set({
      timestamp: new Date().toISOString(),
      message: 'Hello from Firebase Admin SDK!',
      source: 'backend',
    });

    // Attempt to read it
    const doc = await docRef.get();
    
    return NextResponse.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    console.error('Error testing backend:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
