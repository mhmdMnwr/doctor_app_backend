import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async findByUsername(username: string) {
    return this.adminModel.findOne({ username }).exec();
  }

  async findById(id: string) {
    return this.adminModel.findById(id).exec();
  }

  async getMe(id: string) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    const adminObj = admin.toObject();
    const { password, ...rest } = adminObj;
    return rest;
  }

  async updateMe(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (updateAdminDto.username && updateAdminDto.username !== admin.username) {
      const existing = await this.findByUsername(updateAdminDto.username);
      if (existing) {
        throw new ConflictException('Username already taken');
      }
      admin.username = updateAdminDto.username;
    }

    if (updateAdminDto.address !== undefined) {
      admin.address = updateAdminDto.address;
    }

    if (updateAdminDto.phoneNumber !== undefined) {
      admin.phoneNumber = updateAdminDto.phoneNumber;
    }

    await admin.save();

    const updatedObj = admin.toObject();
    const { password, ...rest } = updatedObj;
    return {
      message: 'Admin updated successfully',
      data: rest,
    };
  }
}
