import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Paths, Directory } from 'expo-file-system';

const PHOTO_DIR_NAME = 'photos';

function getPhotoDirectory(): Directory {
  return new Directory(Paths.document, PHOTO_DIR_NAME);
}

export async function ensurePhotoDirectory(): Promise<void> {
  const dir = getPhotoDirectory();
  if (!dir.exists) {
    dir.create();
  }
}

export async function compressAndSavePhoto(uri: string): Promise<string> {
  await ensurePhotoDirectory();

  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  const filename = `plant_${Date.now()}.jpg`;
  const destination = new File(getPhotoDirectory(), filename);
  const source = new File(manipulated.uri);
  source.move(destination);

  return destination.uri;
}

export async function getImageBase64(uri: string): Promise<string> {
  const file = new File(uri);
  const content = file.text();
  // For base64, read as array buffer and convert
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function deletePhoto(uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
