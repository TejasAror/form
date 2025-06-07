"use server";


import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const generateForm = async (prevState: unknown, formData: FormData) => {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // define the schema for validation
    const schema = z.object({
      description: z.string().min(1, "Description is required"),
    });

    const result = schema.safeParse({
      description: formData.get("description") as string,
    });

    if (!result.success) {
      return {
        success: false,
        message: "Invalid form data",
        error: result.error.errors,
      };
    }

    const description = result.data.description;

    if (!process.env.OPENAI_API_KEY) {
      return { success: false, message: "OPENAI api key not found" };
    }

    const prompt =
      "Create a json form with the following fields: title, fields(If any field include options then keep it inside array not object),button only t3 fields should be inside content object, dont add any other nested object";

   

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Use "gpt-4-turbo" if "gpt-4" is unavailable
        messages: [
          {
            role: "user",
            content: `${description} ${prompt}`
          }
        ],
      });
      
      console.log("AI generated form ->", completion.choices[0].message.content);
      


    const formContent = completion.choices[0]?.message.content;

    if (!formContent) {
      return { success: false, message: "Failed to generate form content" };
    }

    let formJsonData;
    try {
      formJsonData = JSON.parse(formContent);
    } catch (error) {
      console.log("Error parsing JSON", error);
      return {
        success: false,
        message: "Generated form content is not valid JSON",
      };
    }
    // save the generated form to database

    const form = await prisma.form.create({
        data:{
            ownerId:user.id,
            content:formJsonData ? formJsonData : null
        }
    });

    revalidatePath("/dashboard/forms"); // Optionally revalidate a path if necessary

    return {
        success:true,
        message:"form generated succesfuly",
        data:form
    }
  } catch (error) {
    console.log("Error generated form", error);
    return { success: false, message:"An error occured while generating the form"}
  }
};
