import * as ImagePicker from 'expo-image-picker';
import { USE_FAKE_DATA } from '../constants/env';

// Step 1: Pick image from camera or library
export async function pickPhoto(): Promise<{
  uri: string;
  base64: string;
} | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    base64: true, // needed for Claude Vision
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets[0]) return null;

  return {
    uri: result.assets[0].uri,
    base64: result.assets[0].base64 ?? '',
  };
}

// Step 2: Get presigned S3 URL from Lambda, then upload directly to S3
// Lambda POST /posts returns a presigned_url field — upload to that
// This is called AFTER the post is created and we have the presigned URL
export async function uploadToS3(
  presignedUrl: string,
  imageUri: string
): Promise<void> {
  if (USE_FAKE_DATA) return;

  const blob = await uriToBlob(imageUri);
  await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: blob,
  });
}

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

// Full flow used by SubmitReportScreen:
//
// 1. const photo = await pickPhoto();
// 2. If litter: pass photo.base64 directly to createPost()
//    Lambda calls Claude Vision internally — no separate analyze-photo endpoint
// 3. const post = await createPost({ ...data, photo_url: null }); // null until uploaded
// 4. await uploadToS3(post.presigned_url, photo.uri); // upload to S3
// 5. Lambda has already stored the final S3 URL and Claude Vision result on the post record
// 6. Navigate to ReportConfirmScreen with the returned post — shows claude_vision fields
