import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import slugify from 'slugify'

export function getS3CsvPath(orgId: string, projectId: string, fileId: string, filename: string): string {
    return `screaming-frog-analysis/${orgId}/${projectId}/${fileId}/${slugify(filename, { lower: true })}`
}

export function getS3PromptPath(orgId: string, projectId: string, fileId: string, timestamp: string): string {
    return `screaming-frog-analysis/${orgId}/${projectId}/${fileId}/prompts/prompt-${timestamp}.md`
}

export function getS3ReportPath(orgId: string, projectId: string, fileId: string, timestamp: string): string {
    return `screaming-frog-analysis/${orgId}/${projectId}/${fileId}/reports/report-${timestamp}.md`
}

export function getS3Client(): S3Client {
    return new S3Client({
        region: process.env.S3_STORAGE_REGION ?? '',
        credentials: {
            accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY ?? ''
        }
    })
}

export async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const s3 = getS3Client()
    const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType
        })
    )
    return `s3://${bucket}/${key}`
}

export function getTimestamp(): string {
    const now = new Date()
    return now
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 14) // YYYYMMDDHHmmss
}
