declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";

  type Options = {
    enabled?: boolean;
    label?: boolean;
  };

  const plugin: MarkdownIt.PluginWithOptions<Options>;
  export default plugin;
}
