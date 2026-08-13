import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import MuxManager from "../utils/MuxManager";
import { UserType } from "@prisma/client";
import { isCreator, isUser } from "../utils/userTypeHelper";
import { notificationService } from "../services/NotificationService";
import { NotificationController } from "./notificationController";
import { isAccessExpired, computeAccessExpiry, parseAccessPolicyInput } from "../utils/accessExpiry";
import { resolveUser } from "../utils/userLookup";
import dotenv from "dotenv";

dotenv.config();

// Initialize Mux Manager
const muxManager = new MuxManager({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  timeout: 30000
});

export class CourseController {
  // ============ COURSE MANAGEMENT ============

  /**
   * Create a new course (Creator only)
   */
  static async createCourse(req: any, res: Response) {
    const { 
      title, 
      description, 
      thumbnail,
      thumbnail_url, 
      price = 0, 
      category, 
      tags = [], 
      level,
      language = "English",
      status = "DRAFT"
    } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!title) {
      return ApiResponseHandler.customError(res, "Course title is required", 400, "MISSING_TITLE");
    }

    // Check if user is a creator
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !isCreator(user.user_type)) {
      return ApiResponseHandler.customError(res, "Only creators can create courses", 403, "FORBIDDEN");
    }

    // Optional access-expiry policy (Feature #8)
    const accessPolicy = parseAccessPolicyInput(req.body);

    try {
      const course = await prisma.courses.create({
        data: {
          title,
          description,
          thumbnail,
          thumbnail_url,
          price: parseFloat(price),
          category,
          tags: Array.isArray(tags) ? tags : [],
          level,
          language,
          status,
          creator_id: userId,
          published_at: status === "PUBLISHED" ? new Date() : null,
          access_duration_days: accessPolicy.access_duration_days,
          access_duration_unit: accessPolicy.access_duration_unit,
          access_expires_at: accessPolicy.access_expires_at,
          whatsapp_community_url: req.body.whatsapp_community_url?.trim() || null,
          thankyou_message: req.body.thankyou_message?.trim() || null
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true
            }
          }
        }
      });

      ApiResponseHandler.success(res, { course }, "Course created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Public: list published courses for a creator (no auth required)
   */
  static async getPublicCourses(req: Request, res: Response) {
    const { creator_id, page = 1, limit = 50, category, search } = req.query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { status: "PUBLISHED" };

      if (creator_id) {
        whereClause.creator_id = String(creator_id);
      }

      if (category) {
        whereClause.category = String(category);
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.courses.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                profile_image: true
              }
            },
            videos: {
              where: { status: "READY" },
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
                is_free: true,
                thumbnail_url: true
              },
              orderBy: { order: 'asc' }
            },
            _count: { select: { enrollments: true } }
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.courses.count({ where: whereClause })
      ]);

      const publicCourses = courses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        thumbnail_url: c.thumbnail_url,
        price: c.price,
        category: c.category,
        tags: c.tags,
        level: c.level,
        language: c.language,
        creator: c.creator,
        total_videos: c.videos.length,
        total_duration: c.videos.reduce((sum, v) => sum + (v.duration || 0), 0),
        total_students: c._count.enrollments,
        videos: c.videos.map(v => ({
          id: v.id,
          title: v.title,
          duration: v.duration,
          order: v.order,
          is_free: v.is_free,
          thumbnail_url: v.thumbnail_url
        }))
      }));

      ApiResponseHandler.success(res, {
        courses: publicCourses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Courses retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get all courses
   * - USER: Can see all published courses
   * - CREATOR: Can see their own courses (all statuses)
   */
  static async getAllCourses(req: any, res: Response) {
    console.log("req.user" , req.user );
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      category,
      level,
      status,
      search,
      my_courses
    } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause based on user type
      const whereClause: any = {};

      if (isCreator(user.user_type) && my_courses === "true") {
        // Creators viewing their own courses (creator dashboard)
        whereClause.creator_id = userId;

        // Apply status filter if provided
        if (status) {
          whereClause.status = status;
        }
      } else {
        // All users (including creators browsing) see only published courses
        whereClause.status = "PUBLISHED";
      }

      // Apply filters
      if (category) {
        whereClause.category = category;
      }

      if (level) {
        whereClause.level = level;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.courses.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                profile_image: true
              }
            },
            videos: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                status: true,
                is_free: true,
                order: true,
                mux_upload_id: true,
                mux_asset_id: true,
                playback_url: true,
                thumbnail_url: true
              },
              orderBy: { order: 'asc' }
            },
            enrollments: isUser(user.user_type) ? {
              where: { user_id: userId },
              select: {
                id: true,
                enrolled_at: true,
                progress: true
              }
            } : false
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.courses.count({ where: whereClause })
      ]);

      // Update video status from Mux for each course
      const coursesWithUpdatedStatus = await Promise.all(
        courses.map(async (course) => {
          // Update status for each video
          const videosWithStatus = await Promise.all(
            course.videos.map(async (video) => {
              let currentStatus = video.status;
              let updatedPlaybackUrl = video.playback_url;
              let updatedThumbnailUrl = video.thumbnail_url;
              let updatedDuration = video.duration;
              let updatedMuxAssetId = video.mux_asset_id;
              
              // Only check Mux status for videos that are not READY or ERROR
              if (video.status !== 'READY' && video.status !== 'ERROR' && video.mux_upload_id) {
                try {
                  const uploadStatus = await muxManager.getUpload(video.mux_upload_id);
                  
                  // Update status based on Mux upload status
                  if (uploadStatus.status === 'asset_created' && uploadStatus.asset_id) {
                    const asset = await muxManager.getAsset(uploadStatus.asset_id);
                    currentStatus = asset.status === 'ready' ? 'READY' : 'PROCESSING';
                    updatedMuxAssetId = asset.id;
                    updatedDuration = asset.duration || video.duration;
                    
                    // Update database with new status
                    const updateData: any = {
                      mux_asset_id: asset.id,
                      status: currentStatus,
                      duration: asset.duration || null
                    };

                    // Get playback URLs if available
                    if (asset.playback_ids && asset.playback_ids.length > 0) {
                      const playbackId = asset.playback_ids[0];
                      updateData.mux_playback_id = playbackId.id;
                      updateData.playback_url = `https://stream.mux.com/${playbackId.id}.m3u8`;
                      updateData.thumbnail_url = `https://image.mux.com/${playbackId.id}/thumbnail.jpg`;
                      
                      // Update local variables for immediate return
                      updatedPlaybackUrl = updateData.playback_url;
                      updatedThumbnailUrl = updateData.thumbnail_url;
                    }

                    await prisma.videos.update({
                      where: { id: video.id },
                      data: updateData
                    });
                  } else if (uploadStatus.status === 'errored') {
                    currentStatus = 'ERROR';
                    await prisma.videos.update({
                      where: { id: video.id },
                      data: { status: 'ERROR' }
                    });
                  }
                } catch (err) {
                  console.error(`Error checking Mux status for video ${video.id}:`, err);
                }
              }
              
              return {
                ...video,
                current_video_status: currentStatus,
                playback_url: updatedPlaybackUrl,
                thumbnail_url: updatedThumbnailUrl,
                duration: updatedDuration,
                mux_asset_id: updatedMuxAssetId
              };
            })
          );

          return {
            ...course,
            videos: videosWithStatus
          };
        })
      );

      console.log("coursesWithUpdatedStatus" ,JSON.stringify(coursesWithUpdatedStatus, null, 2) );  

      ApiResponseHandler.success(res, {
        courses: coursesWithUpdatedStatus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Courses retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get single course by ID
   */
  static async getCourseById(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      
      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      const course = await prisma.courses.findUnique({
        where: { id: courseId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true,
              kyc_verified: true,
              instagram_link: true,
              linkedin_link: true,
              youtube_link: true,
              facebook_link: true
            }
          },
          videos: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              status: true,
              is_free: true,
              order: true,
              thumbnail_url: true,
              playback_url: true,
              mux_asset_id: true,
              mux_upload_id: true
            },
            orderBy: { order: 'asc' }
          },
          enrollments: isUser(user.user_type) ? {
            where: { user_id: userId }
          } : false
        }
      });

      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      // Check access permissions — course creator always has full access
      const isOwner = course.creator_id === userId;

      if (!isOwner && isCreator(user.user_type) && !isUser(user.user_type)) {
        return ApiResponseHandler.customError(res, "You don't have access to this course", 403, "FORBIDDEN");
      }

      if (!isOwner && course.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Course not available", 403, "COURSE_NOT_AVAILABLE");
      }

      const enrollment = isUser(user.user_type) &&
                         course.enrollments &&
                         course.enrollments.length > 0
                         ? course.enrollments[0]
                         : null;

      // Access-expiry (Feature #8): an expired enrollment loses content access
      const accessExpired = enrollment
        ? isAccessExpired(course, enrollment.enrolled_at)
        : false;
      const accessExpiresAt = enrollment
        ? computeAccessExpiry(course, enrollment.enrolled_at)
        : null;

      const isEnrolled = !!enrollment && !accessExpired;

      const totalStudents = await prisma.enrollments.count({
        where: { course_id: courseId }
      });

      // Filter videos based on enrollment status (expired == not enrolled)
      let videosToShow = course.videos;
      if (isUser(user.user_type) && !isEnrolled && course.creator_id !== userId) {
        // Show only free videos to non-enrolled (or expired) users
        videosToShow = course.videos.filter(v => v.is_free);
      }


      ApiResponseHandler.success(res, {
        course: {
          ...course,
          videos: videosToShow,
          total_videos: course.videos.length,
          total_duration: course.videos.reduce((sum, v) => sum + (v.duration || 0), 0),
          total_students: totalStudents,
          is_enrolled: isEnrolled,
          access_expired: accessExpired,
          access_expires_at: accessExpiresAt,
          enrollment_info: enrollment
        }
      }, "Course retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update course (Creator only - own courses)
   */
  static async updateCourse(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const { 
      title, 
      description, 
      thumbnail,
      thumbnail_url, 
      price, 
      category, 
      tags, 
      level,
      language,
      status
    } = req.body;

    try {
      // Check if course exists and user is the creator
      const existingCourse = await prisma.courses.findUnique({
        where: { id: courseId }
      });

      if (!existingCourse) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (existingCourse.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to update this course", 403, "FORBIDDEN");
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
      if (level !== undefined) updateData.level = level;
      if (language !== undefined) updateData.language = language;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "PUBLISHED" && !existingCourse.published_at) {
          updateData.published_at = new Date();
        }
      }
      // Access-expiry policy (Feature #8) — only touch when the client sends a field
      if (req.body.access_duration_days !== undefined) {
        const parsed = parseAccessPolicyInput(req.body);
        updateData.access_duration_days = parsed.access_duration_days;
        updateData.access_duration_unit = parsed.access_duration_unit;
      }
      if (req.body.access_expires_at !== undefined) {
        updateData.access_expires_at = parseAccessPolicyInput(req.body).access_expires_at;
      }
      if (req.body.whatsapp_community_url !== undefined) {
        updateData.whatsapp_community_url = req.body.whatsapp_community_url?.trim() || null;
      }
      if (req.body.thankyou_message !== undefined) {
        updateData.thankyou_message = req.body.thankyou_message?.trim() || null;
      }

      const course = await prisma.courses.update({
        where: { id: courseId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true,
              kyc_verified: true,
              instagram_link: true,
              linkedin_link: true,
              youtube_link: true,
              facebook_link: true
            }
          },
          videos: true
        }
      });

      ApiResponseHandler.success(res, { course }, "Course updated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete course (Creator only - own courses)
   */
  static async deleteCourse(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;

    try {
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
        include: { videos: true }
      });

      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (course.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to delete this course", 403, "FORBIDDEN");
      }

      // Delete associated Mux assets
      for (const video of course.videos) {
        if (video.mux_asset_id) {
          try {
            await muxManager.deleteAsset(video.mux_asset_id);
          } catch (err) {
            console.error(`Failed to delete Mux asset ${video.mux_asset_id}:`, err);
          }
        }
      }

      // Delete course (cascade will delete videos and enrollments)
      await prisma.courses.delete({
        where: { id: courseId }
      });

      ApiResponseHandler.success(res, {}, "Course deleted successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ VIDEO MANAGEMENT ============

  /**
   * Create direct upload URL for video (Creator only)
   */
  static async createVideoUpload(req: any, res: Response) {
    const { courseId } = req.params;
    const { title, description, thumbnail_url, is_free = false, order = 0 } = req.body;
    const userId = req.user.userId;

    if (!title) {
      return ApiResponseHandler.customError(res, "Video title is required", 400, "MISSING_TITLE");
    }

    try {
      // Check if course exists and user is the creator
      const course = await prisma.courses.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (course.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to add videos to this course", 403, "FORBIDDEN");
      }

      // Create direct upload in Mux
      const upload = await muxManager.createDirectUpload({
        timeout: 3600,
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'none'
        }
      });

      // Create video record in database
      const video = await prisma.videos.create({
        data: {
          course_id: courseId,
          title,
          description,
          thumbnail_url,
          mux_upload_id: upload.id,
          upload_url: upload.url,
          status: "UPLOADING",
          is_free: Boolean(is_free),
          order: Number(order)
        }
      });

      console.log("video" ,JSON.stringify(video, null, 2) );

      ApiResponseHandler.success(res, {
        video,
        upload_url: upload.url,
        upload_id: upload.id
      }, "Video upload URL created successfully", 201);
    } catch (err: any) {
      console.log(err.message);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get video upload status
   */
  static async getVideoUploadStatus(req: any, res: Response) {
    const { videoId } = req.params;
    const userId = req.user.userId;

    try {

      console.log("videoId" ,videoId );
      const video = await prisma.videos.findUnique({
        where: { id: videoId },
        include: {
          course: {
            select: {
              creator_id: true
            }
          }
        }
      });

      if (!video) {
        return ApiResponseHandler.customError(res, "Video not found", 404, "VIDEO_NOT_FOUND");
      }

      if (video.course.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to view this video", 403, "FORBIDDEN");
      }

      // Check Mux upload status if upload_id exists
      let uploadStatus = null;
      if (video.mux_upload_id) {
        try {
          uploadStatus = await muxManager.getUpload(video.mux_upload_id);
          
          // Update video status based on Mux upload status
          if (uploadStatus.status === 'asset_created' && uploadStatus.asset_id) {
            // Get asset details
            const asset = await muxManager.getAsset(uploadStatus.asset_id);
            
            const updateData: any = {
              mux_asset_id: asset.id,
              status: asset.status === 'ready' ? 'READY' : 'PROCESSING',
              duration: asset.duration || null
            };

            // Get playback URLs
            if (asset.playback_ids && asset.playback_ids.length > 0) {
              const playbackId = asset.playback_ids[0];
              updateData.mux_playback_id = playbackId.id;
              updateData.playback_url = `https://stream.mux.com/${playbackId.id}.m3u8`;
              updateData.thumbnail_url = `https://image.mux.com/${playbackId.id}/thumbnail.jpg`;
            }

            await prisma.videos.update({
              where: { id: videoId },
              data: updateData
            });

            // Fetch updated video
            const updatedVideo = await prisma.videos.findUnique({
              where: { id: videoId }
            });

            console.log("updatedVideo" ,JSON.stringify(updatedVideo, null, 2) );
            console.log("uploadStatus" ,JSON.stringify(uploadStatus, null, 2) );

            return ApiResponseHandler.success(res, {
              video: updatedVideo,
              mux_upload_status: uploadStatus
            }, "Video upload status retrieved successfully");
          }
        } catch (err) {
          console.error("Error fetching Mux upload status:", err);
        }
      }

      ApiResponseHandler.success(res, {
        video,
        mux_upload_status: uploadStatus
      }, "Video status retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update video details (Creator only)
   * Allows updating: title, description, order, is_free
   * Does NOT allow changing the actual video file
   */
  static async updateVideo(req: any, res: Response) {
    const { videoId } = req.params;
    const userId = req.user.userId;
    const { title, description, thumbnail_url, is_free, order } = req.body;

    try {
      const video = await prisma.videos.findUnique({
        where: { id: videoId },
        include: {
          course: {
            select: {
              id: true,
              creator_id: true,
              title: true
            }
          }
        }
      });

      if (!video) {
        return ApiResponseHandler.customError(res, "Video not found", 404, "VIDEO_NOT_FOUND");
      }

      if (video.course.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to update this video", 403, "FORBIDDEN");
      }

      // Build update data
      const updateData: any = {};
      if (title !== undefined) {
        if (title.trim() === '') {
          return ApiResponseHandler.customError(res, "Video title cannot be empty", 400, "INVALID_TITLE");
        }
        updateData.title = title;
      }
      if (description !== undefined) updateData.description = description;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
      if (is_free !== undefined) updateData.is_free = Boolean(is_free);
      if (order !== undefined) {
        if (order < 0) {
          return ApiResponseHandler.customError(res, "Order must be a positive number", 400, "INVALID_ORDER");
        }
        updateData.order = Number(order);
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return ApiResponseHandler.customError(res, "No fields to update", 400, "NO_UPDATE_DATA");
      }

      const updatedVideo = await prisma.videos.update({
        where: { id: videoId },
        data: updateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              creator_id: true
            }
          }
        }
      });

      ApiResponseHandler.success(res, { 
        video: updatedVideo,
        message: "Video details updated successfully. The video file itself cannot be changed."
      }, "Video updated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete video (Creator only)
   */
  static async deleteVideo(req: any, res: Response) {
    const { videoId } = req.params;
    const userId = req.user.userId;

    try {
      const video = await prisma.videos.findUnique({
        where: { id: videoId },
        include: {
          course: {
            select: {
              creator_id: true
            }
          }
        }
      });

      if (!video) {
        return ApiResponseHandler.customError(res, "Video not found", 404, "VIDEO_NOT_FOUND");
      }

      if (video.course.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to delete this video", 403, "FORBIDDEN");
      }

      // Delete Mux asset if exists
      if (video.mux_asset_id) {
        try {
          await muxManager.deleteAsset(video.mux_asset_id);
        } catch (err) {
          console.error(`Failed to delete Mux asset ${video.mux_asset_id}:`, err);
        }
      }

      await prisma.videos.delete({
        where: { id: videoId }
      });

      ApiResponseHandler.success(res, {}, "Video deleted successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ ENROLLMENT MANAGEMENT ============

  /**
   * Enroll in a course (USER only) - DEPRECATED
   * Note: Direct enrollment is no longer supported for paid courses.
   * Users must complete payment through /payments/create-order endpoint.
   * This endpoint only works for FREE courses now.
   */
  static async enrollInCourse(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      
      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      if (!isUser(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only regular users can enroll in courses", 403, "FORBIDDEN");
      }

      const course = await prisma.courses.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (course.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Course is not available for enrollment", 400, "COURSE_NOT_AVAILABLE");
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        }
      });

      if (existingEnrollment) {
        return ApiResponseHandler.customError(res, "Already enrolled in this course", 400, "ALREADY_ENROLLED");
      }

      // Only allow direct enrollment for FREE courses
      if (course.price > 0) {
        return ApiResponseHandler.customError(
          res, 
          "This is a paid course. Please use /payments/create-order endpoint to purchase and enroll.", 
          400, 
          "PAYMENT_REQUIRED"
        );
      }

      // Create transaction record for free course
      const transaction = await prisma.transactions.create({
        data: {
          user_id: userId,
          course_id: courseId,
          amount: 0,
          currency: "INR",
          status: "SUCCESS",
          payment_method: "FREE",
          completed_at: new Date()
        }
      });

      // Create enrollment for free course
      const enrollment = await prisma.enrollments.create({
        data: {
          user_id: userId,
          course_id: courseId,
          transaction_id: transaction.id
        },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile_image: true
                }
              },
              videos: true
            }
          }
        }
      });

      // Send course purchase notification
      notificationService.sendCoursePurchaseNotification({
        customerName: user.name || 'there',
        customerEmail: user.email,
        customerPhone: user.phone || undefined,
        courseName: course.title,
        courseAccessLink: `${process.env.APP_URL || 'https://manchly.com'}/courses/${courseId}`,
        hostName: enrollment.course.creator?.name || 'Manchly',
      }).catch(err => console.error('Free course notification error:', err));

      ApiResponseHandler.success(res, {
        enrollment,
        transaction,
        message: "Successfully enrolled in free course"
      }, "Successfully enrolled in course", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Manually grant a user access to a course without payment.
   * Allowed for the course owner (creator) or an ADMIN.
   * The target user is identified by `user_id`, `email`, or `phone` in the body.
   * Creates an enrollment with a null `transaction_id`, which is how a
   * manual/comp grant is distinguished from a paid or free enrollment
   * (both of those always carry a transaction_id).
   */
  static async grantCourseAccess(req: any, res: Response) {
    const { courseId } = req.params;
    const requesterId = req.user.userId;
    const { user_id, phone, email } = req.body;

    try {
      if (!user_id && !phone && !email) {
        return ApiResponseHandler.customError(res, "Provide a user_id, phone, or email to grant access to", 400, "MISSING_TARGET");
      }

      const course = await prisma.courses.findUnique({ where: { id: courseId } });
      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      // Authorization: only the course owner or an admin may grant access
      const requester = await prisma.users.findUnique({
        where: { id: requesterId },
        select: { user_type: true },
      });
      const isAdmin = requester?.user_type?.includes(UserType.ADMIN) ?? false;
      if (course.creator_id !== requesterId && !isAdmin) {
        return ApiResponseHandler.customError(res, "You don't have permission to grant access to this course", 403, "FORBIDDEN");
      }

      // Resolve the target user (tolerates country-code/format differences in
      // how the phone was stored — a bare 10-digit lookup still matches a
      // stored "+91…" variant of the same number).
      const targetUser = await resolveUser({ user_id, phone, email });
      if (!targetUser) {
        return ApiResponseHandler.customError(res, "No user found for the given identifier", 404, "USER_NOT_FOUND");
      }

      // Idempotent: if the user already has access, return the existing enrollment
      const existing = await prisma.enrollments.findUnique({
        where: { user_id_course_id: { user_id: targetUser.id, course_id: courseId } },
      });
      if (existing) {
        return ApiResponseHandler.success(res, { enrollment: existing, alreadyEnrolled: true }, "User already has access to this course", 200);
      }

      // Create a manual enrollment (no payment — transaction_id stays null).
      // Guard the race where two concurrent grants both pass the check above:
      // the unique constraint then just means "already enrolled", not a 500.
      let enrollment;
      try {
        enrollment = await prisma.enrollments.create({
          data: {
            user_id: targetUser.id,
            course_id: courseId,
          },
        });
      } catch (createErr: any) {
        if (createErr?.code === "P2002") {
          const now = await prisma.enrollments.findUnique({
            where: { user_id_course_id: { user_id: targetUser.id, course_id: courseId } },
          });
          return ApiResponseHandler.success(res, { enrollment: now, alreadyEnrolled: true }, "User already has access to this course", 200);
        }
        throw createErr;
      }

      // Notify the user they've been granted access
      NotificationController.createNotification({
        userId: targetUser.id,
        type: "COURSE",
        title: "Course Access Granted",
        message: `You've been given access to "${course.title}".`,
        data: { courseId },
      }).catch(err => console.error("Notification error:", err));

      return ApiResponseHandler.success(res, { enrollment }, "Access granted successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get user's enrolled courses
   */
  static async getEnrolledCourses(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      const [enrollments, total] = await Promise.all([
        prisma.enrollments.findMany({
          where: { user_id: userId },
          skip,
          take: Number(limit),
          include: {
            course: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_image: true
                  }
                },
                videos: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    status: true
                  }
                }
              }
            }
          },
          orderBy: { enrolled_at: 'desc' }
        }),
        prisma.enrollments.count({ where: { user_id: userId } })
      ]);

      ApiResponseHandler.success(res, {
        enrollments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Enrolled courses retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update enrollment progress
   */
  static async updateProgress(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return ApiResponseHandler.customError(res, "Valid progress value (0-100) is required", 400, "INVALID_PROGRESS");
    }

    try {
      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        }
      });

      if (!enrollment) {
        return ApiResponseHandler.customError(res, "Not enrolled in this course", 404, "NOT_ENROLLED");
      }

      const updatedEnrollment = await prisma.enrollments.update({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        },
        data: {
          progress: parseFloat(progress),
          last_watched_at: new Date(),
          completed_at: parseFloat(progress) >= 100 ? new Date() : null
        }
      });

      ApiResponseHandler.success(res, { enrollment: updatedEnrollment }, "Progress updated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Unenroll from a course
   */
  static async unenrollFromCourse(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;

    try {
      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        }
      });

      if (!enrollment) {
        return ApiResponseHandler.customError(res, "Not enrolled in this course", 404, "NOT_ENROLLED");
      }

      await prisma.enrollments.delete({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        }
      });

      ApiResponseHandler.success(res, {}, "Successfully unenrolled from course");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ STATISTICS ============

  /**
   * Get creator statistics
   */
  static async getCreatorStats(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view statistics", 403, "FORBIDDEN");
      }

      const [totalCourses, publishedCourses, totalEnrollments, totalVideos, coursesSold] = await Promise.all([
        prisma.courses.count({ where: { creator_id: userId } }),
        prisma.courses.count({ where: { creator_id: userId, status: "PUBLISHED" } }),
        prisma.enrollments.count({
          where: {
            course: {
              creator_id: userId
            }
          }
        }),
        prisma.videos.count({
          where: {
            course: {
              creator_id: userId
            }
          }
        }),
        prisma.courses.count({
          where: {
            creator_id: userId,
            enrollments: {
              some: {}
            }
          }
        })
      ]);

      // Get course-wise enrollment count
      const courseEnrollments = await prisma.courses.findMany({
        where: { creator_id: userId },
        include: {
          _count: {
            select: { enrollments: true }
          }
        }
      });

      ApiResponseHandler.success(res, {
        statistics: {
          total_courses: totalCourses,
          published_courses: publishedCourses,
          draft_courses: totalCourses - publishedCourses,
          total_enrollments: totalEnrollments,
          total_videos: totalVideos,
          courses_sold: coursesSold,
          courses_with_enrollments: courseEnrollments.map(c => ({
            course_id: c.id,
            course_title: c.title,
            enrollments: c._count.enrollments
          }))
        }
      }, "Creator statistics retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
