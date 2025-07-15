import { NextResponse } from 'next/server';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request) {
  try {
    console.log('Testing Firebase Storage...');
    console.log('Storage bucket:', storage.app.options.storageBucket);
    
    // Test Firebase Storage access
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testRef = ref(storage, 'test/test.txt');
    
    console.log('Test reference:', testRef.fullPath);
    
    // Try to upload
    console.log('Attempting upload...');
    const uploadResult = await uploadBytes(testRef, testData);
    console.log('Upload successful:', uploadResult);
    
    // Try to get download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(testRef);
    console.log('Download URL:', downloadURL);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Storage is working',
      downloadURL,
      bucket: storage.app.options.storageBucket
    });
    
  } catch (error) {
    console.error('Firebase Storage test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      bucket: storage.app.options.storageBucket
    }, { status: 500 });
  }
} 