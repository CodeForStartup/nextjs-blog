"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { createPost, Prisma, updatePost } from "database"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import AsyncCreatableSelect from "react-select/async-creatable"
import { toast } from "react-toastify"
import { buttonVariants, cn, Label, LoadingButton } from "ui"
import z from "zod"

import APP_ROUTES from "@/constants/routes"
import InputTitle from "@/molecules/input-title"
import { TPostItem } from "@/types/posts"

const Editor = dynamic(() => import("../editor-js"), { ssr: false })

const PostForm = ({ post: postData }: { post?: TPostItem }) => {
  const { title = "", content = "", tagOnPost = [] } = postData || {}
  const t = useTranslations()
  const session = useSession()
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const userId = session?.data?.user?.id

  const { postId } = useParams()

  const postSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    tags: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          id: z.string().optional().nullable(),
          __isNew__: z.boolean().optional().nullable(),
        })
      )
      .max(5, "You can only add up to 5 tags")
      .optional()
      .nullable(),
    content: z.string(),
    //   .max(10000, "Content must be at most 10000 characters")
    //   .min(100, "Content must be at least 10 characters"),
  }) satisfies z.ZodType<Partial<Prisma.PostCreateInput>>

  const {
    control,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm({
    defaultValues: {
      title,
      tags: tagOnPost?.map((tag) => ({
        id: tag?.tag?.id,
        label: tag?.tag?.name,
        value: tag?.tag?.id,
        __isNew__: false,
      })),
      content,
    },
    resolver: zodResolver(postSchema),
  })

  const handleSubmitPost = async (data) => {
    let newPostId = postId as string
    try {
      setPending(true)
      if (postId) {
        await updatePost(postId as string, data, userId)
        toast.success(t("common.post_created"))
      } else {
        const post = await createPost(data, userId)
        newPostId = post.data.id
        toast.success(t("common.post_updated"))
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      router.push(APP_ROUTES.POST.replace(":postId", newPostId))
      setPending(false)
    }
  }

  const promiseOptions = async (inputValue: string) => {
    const rawData = await fetch(`/api/protected/tags?search=${inputValue}`)
    const tags = await rawData.json()

    return tags.map((tag) => ({
      label: tag.name,
      value: tag.id,
    }))
  }

  return (
    <div className="w-full">
      {/* <div className="mb-4 flex justify-between">
        <div className="flex">
          <Link
            href={APP_ROUTES.USER_POSTS}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <ArrowLeft />
            <div className="ml-2">{t("common.back")}</div>
          </Link>
        </div>
        <div className="flex gap-4">
          {postData && (
            <div className="text-bold flex items-center gap-2">
              <div className="text-sm">{t("common.last_update_at")}</div>
              <div className="font-bold">
                {dayjs(postData?.updatedAt).format(DD_MMM_YYYY_HH_MM)}
              </div>
            </div>
          )}
        </div>
      </div> */}
      <form
        className="mb-4 w-full"
        onSubmit={handleSubmit(handleSubmitPost)}
      >
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-3 mb-4 w-full rounded-md">
            <div className="w-full">
              <div className="px-[58px]">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <InputTitle
                      placeholder={t("common.untitled")}
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="mt-3">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Editor
                      data={field.value ? JSON.parse(field.value) : {}}
                      onChange={(data) => {
                        field.onChange(JSON.stringify(data))
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="col-span-1">
            <div className="flex h-[150px] items-center justify-center rounded-sm bg-slate-300">
              Cover Image
            </div>
            <div className="mt-4">
              <Label>Tags</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <AsyncCreatableSelect
                    isMulti
                    isClearable
                    placeholder={t("common.tags")}
                    name="colors"
                    classNamePrefix="select"
                    loadOptions={promiseOptions}
                    components={{
                      IndicatorSeparator: () => null,
                    }}
                    value="reactjs"
                    classNames={{
                      container: () => "w-full border rounded",
                      menu: () => "dark:!bg-gray-900",
                      singleValue: () => "text-gray-900 dark:text-gray-100",
                      multiValue: () => "bg-transparent",
                      input: () => "dark:text-white",
                      multiValueRemove: () => "text-red-500",
                      control: () => "!bg-transparent !border-none",
                      option: () => "hover:bg-gray-100 dark:bg-gray-800 hover:cursor-pointer",
                      noOptionsMessage: () => "text-gray-500 dark:bg-gray-800",
                    }}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-start gap-4 p-2">
          <LoadingButton
            type="submit"
            loading={pending}
            className="w-[150px] uppercase"
          >
            {t("common.publish")}
          </LoadingButton>
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "w-[150px] uppercase")}
            href={APP_ROUTES.USER_POSTS}
          >
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </div>
  )
}

export default PostForm
