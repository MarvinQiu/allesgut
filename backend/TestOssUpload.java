import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.PutObjectRequest;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public class TestOssUpload {
    public static void main(String[] args) {
        String endpoint = System.getenv("ALIYUN_OSS_ENDPOINT");
        String accessKeyId = System.getenv("ALIYUN_ACCESS_KEY_ID");
        String accessKeySecret = System.getenv("ALIYUN_ACCESS_KEY_SECRET");
        String bucketName = System.getenv("ALIYUN_OSS_BUCKET");

        System.out.println("=== Testing Aliyun OSS Upload ===");
        System.out.println("Endpoint: " + endpoint);
        System.out.println("Bucket: " + bucketName);
        System.out.println("Access Key ID: " + (accessKeyId != null ? accessKeyId.substring(0, Math.min(8, accessKeyId.length())) + "..." : "null"));
        System.out.println();

        if (endpoint == null || accessKeyId == null || accessKeySecret == null || bucketName == null) {
            System.err.println("ERROR: Missing environment variables!");
            System.err.println("Please ensure these are set: ALIYUN_OSS_ENDPOINT, ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET, ALIYUN_OSS_BUCKET");
            System.exit(1);
        }

        OSS ossClient = null;
        try {
            System.out.println("Creating OSS client...");
            ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

            System.out.println("Testing bucket access...");
            boolean exists = ossClient.doesBucketExist(bucketName);
            System.out.println("Bucket exists: " + exists);

            if (!exists) {
                System.err.println("ERROR: Bucket '" + bucketName + "' does not exist or you don't have permission to access it!");
                System.exit(1);
            }

            System.out.println("\nAttempting to upload test file...");
            String testContent = "Test upload from AllesGut backend - " + System.currentTimeMillis();
            String objectKey = "test/test-upload-" + System.currentTimeMillis() + ".txt";

            ByteArrayInputStream inputStream = new ByteArrayInputStream(testContent.getBytes(StandardCharsets.UTF_8));
            PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, objectKey, inputStream);

            ossClient.putObject(putObjectRequest);

            String url = "https://" + bucketName + "." + endpoint.replace("https://", "") + "/" + objectKey;

            System.out.println("\n✅ SUCCESS!");
            System.out.println("File uploaded successfully!");
            System.out.println("Object Key: " + objectKey);
            System.out.println("URL: " + url);
            System.out.println("\nYour OSS configuration is working correctly!");

        } catch (Exception e) {
            System.err.println("\n❌ FAILED!");
            System.err.println("Error: " + e.getMessage());
            System.err.println("\nFull stack trace:");
            e.printStackTrace();

            System.err.println("\n=== Troubleshooting Tips ===");
            System.err.println("1. Verify bucket '" + bucketName + "' exists in region matching endpoint");
            System.err.println("2. Check Access Key ID has write permissions (AliyunOSSFullAccess or similar)");
            System.err.println("3. Ensure endpoint matches bucket region");
            System.err.println("4. Verify credentials are not expired");

            System.exit(1);
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }
    }
}
