import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const publicRootPath = path.resolve(__dirname, '../../public');
// 检查是否有文件夹
export class FileService {
    static async checkFolder(folderPath) {
        try {
            await fs.access(folderPath);
            // console.log('文件夹存在');
            return true;
        }
        catch (error) {
            // console.log('文件夹不存在：', error);
            return false;
        }
    }
    static async makeFolder(folderPath) {
        try {
            await fs.mkdir(folderPath, { recursive: true });
            // console.log('创建文件夹成功');
            return true;
        }
        catch (error) {
            // console.log('创建文件夹失败：', error);
            return false;
        }
    }
    static async checkAndMakeFolder(folderPath) {
        if (await this.checkFolder(folderPath)) {
            // console.log('已经存在文件夹，无需再创建');
            return true;
        }
        else {
            return await this.makeFolder(folderPath);
        }
    }
}
