import { getTagById } from "@/actions/public/tags"
import PostItem from "@/molecules/posts/post-item"
import TagDetail from "@/molecules/tag/tag-detail"

export const metadata = {
  title: "Tags",
  description: "A list of tags used in the blog posts",
}

export default async function Page({ params }: { params: { tagId: string } }) {
  const tag = await getTagById(params?.tagId as string)

  return (
    <div className="grid grid-cols-12 gap-10">
      <TagDetail tag={tag} />
      <div className="col-span-8 rounded-md">
        {tag?.tagOnPost?.map((post) => <PostItem key={post?.post?.id} post={post?.post} />)}
      </div>
    </div>
  )
}