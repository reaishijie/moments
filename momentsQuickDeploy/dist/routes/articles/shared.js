export const MAX_ARTICLE_TAGS = 5;
export function serializeArticle(article) {
    return {
        ...article,
        id: article.id.toString(),
        user_id: article.user_id.toString(),
        user: {
            ...article.user,
            id: article.user.id.toString()
        },
        article_images: article.article_images.map((image) => ({
            ...image,
            id: image.id.toString(),
            article_id: image.article_id?.toString()
        })),
        article_videos: article.article_videos.map((video) => ({
            ...video,
            id: video.id.toString(),
            article_id: video.article_id?.toString()
        })),
        tags: article.tags.map(articleTag => ({
            id: articleTag.tag.id.toString(),
            name: articleTag.tag.name
        }))
    };
}
// 将 article_likes 关系数据序列化为前端点赞人列表所需的结构
function serializeLiker(like) {
    return {
        id: like.user_id.toString(),
        displayName: like.user.nickname || like.user.username,
        username: like.user.username,
        avatar: like.user.avatar
    };
}
// 将 comments 关系数据序列化为两层评论结构
function serializeFeedComment(comment) {
    const parentDisplayName = comment.parent?.user.nickname ?? comment.parent?.user.username ?? null;
    return {
        id: comment.id.toString(),
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        article_id: comment.article_id.toString(),
        user_id: comment.user_id.toString(),
        parent_id: comment.parent_id?.toString() ?? null,
        parent_displayName: parentDisplayName,
        user: {
            ...comment.user,
            id: comment.user.id.toString()
        },
        replies: comment.replies?.map(reply => serializeFeedComment(reply)) ?? []
    };
}
// 序列化列表场景下的文章：在基础字段之上附加 likers / comments / comment_total
export function serializeFeedArticle(article) {
    const { article_likes, comments, _count, ...rest } = article;
    const base = serializeArticle({ ...rest, isLiked: article.isLiked });
    return {
        ...base,
        likers: (article_likes ?? []).map(serializeLiker),
        comments: (comments ?? []).map(serializeFeedComment),
        comment_total: _count?.comments ?? 0
    };
}
export const articleInclude = {
    user: {
        select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            header_background: true
        }
    },
    article_images: { orderBy: { sort_order: 'asc' } },
    article_videos: { orderBy: { sort_order: 'asc' } },
    tags: {
        include: {
            tag: true
        },
        orderBy: {
            tag_id: 'asc'
        }
    }
};
// 列表场景额外带出的聚合数据：每篇文章的点赞人预览 + 前 N 条评论 + 评论总数
// 目的是让首页信息流一次请求即可渲染，避免前端对每篇文章再发起点赞/评论请求（N+1 瀑布）
const FEED_COMMENT_PAGE_SIZE = 3;
const feedMetaInclude = {
    article_likes: {
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    nickname: true,
                    avatar: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    },
    comments: {
        where: {
            deleted_at: null,
            parent_id: null
        },
        orderBy: {
            created_at: 'asc'
        },
        take: FEED_COMMENT_PAGE_SIZE,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    nickname: true,
                    avatar: true
                }
            },
            replies: {
                where: {
                    deleted_at: null
                },
                orderBy: {
                    created_at: 'asc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true
                        }
                    },
                    parent: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    nickname: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    _count: {
        select: {
            comments: {
                where: {
                    deleted_at: null,
                    parent_id: null
                }
            }
        }
    }
};
export const listArticleInclude = {
    ...articleInclude,
    ...feedMetaInclude
};
export function normalizeTagNames(input) {
    const rawTags = Array.isArray(input)
        ? input
        : typeof input === 'string'
            ? input.split(/[\s,，#]+/)
            : [];
    return Array.from(new Set(rawTags
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => tag.slice(0, 50)))).slice(0, MAX_ARTICLE_TAGS);
}
export async function replaceArticleTags(tx, articleId, tagNames, userId) {
    await tx.article_tags.deleteMany({
        where: { article_id: articleId }
    });
    if (tagNames.length === 0)
        return;
    const tags = await Promise.all(tagNames.map(name => tx.tags.upsert({
        where: { name },
        update: {},
        create: {
            name,
            created_by: userId
        }
    })));
    await tx.article_tags.createMany({
        data: tags.map(tag => ({
            article_id: articleId,
            tag_id: tag.id
        })),
        skipDuplicates: true
    });
}
export async function replaceArticleMedia(tx, articleId, imageUrls, videoUrls) {
    if (imageUrls !== undefined) {
        await tx.article_images.deleteMany({
            where: { article_id: articleId }
        });
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            await tx.article_images.createMany({
                data: imageUrls.map((url, index) => ({
                    article_id: articleId,
                    image_url: url,
                    sort_order: index
                }))
            });
        }
    }
    if (videoUrls !== undefined) {
        await tx.article_videos.deleteMany({
            where: { article_id: articleId }
        });
        if (Array.isArray(videoUrls) && videoUrls.length > 0) {
            await tx.article_videos.createMany({
                data: videoUrls.map((url, index) => ({
                    article_id: articleId,
                    video_url: url,
                    sort_order: index
                }))
            });
        }
    }
}
