import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const publicRootPath = path.resolve(__dirname, '../../public');

// 检查是否有文件夹
export class FileService {
    static async checkFolder(folderPath:string): Promise<boolean> {
        try {
            await fs.access(folderPath)
            return true
        } catch (error) {
            return false
        }
    }
    static async makeFolder(folderPath: string): Promise<boolean> {
        try {
            await fs.mkdir(folderPath, { recursive: true})
            return true
        } catch (error) {
            return false
        }
    }
    static async checkAndMakeFolder(folderPath: string): Promise<boolean> {
        if (await this.checkFolder(folderPath)) {
            return true
        } else {
            return await this.makeFolder(folderPath)
        }
    }
}