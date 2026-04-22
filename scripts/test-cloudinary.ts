import 'dotenv/config';
import { cloudinary } from '../src/lib/cloudinary/config';

async function testUpload() {
  console.log('☁️ Probando conexión a Cloudinary...');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Faltan las variables de entorno de Cloudinary en .env.local');
    process.exit(1);
  }

  try {
    const dataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'tablero_control/tests',
      public_id: 'test_pixel'
    });
    console.log('✅ Upload exitoso!');
    console.log('URL de la imagen:', result.secure_url);
    
    // Clean up
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Clean up exitoso.');
  } catch (error) {
    console.error('❌ Error de Cloudinary:', error);
    process.exit(1);
  }
}

testUpload();
