import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/r/content-modelling-collections/
  schema: {
   collections: [
     {
       name: "my_first_collection",
       label: "My first collection",
       path: "content/first",
       fields: [
         {
           type: "string",
           name: "title",
           label: "Title",
           isTitle: true,
           required: true,
         }
       ],
       // Comment this out for now. We will come back to this later!
       ui: {
         router: ({document}) => {
            if (document._sys.filename == "Hello-World") {
              return "/";
            }
          },
       }
       
      //  {
      //    // This is an DEMO router. You can remove this to fit your site
      //    router: ({ document }) => `/demo/blog/${document._sys.filename}`,
      //  },
     },
   ],
 },
});
