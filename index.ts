import { err, ok, Result } from "neverthrow";
import { Spinner } from "@std/cli/unstable-spinner";
import { parse } from "@libs/xml";
import { Item } from "./item.d.ts";
import { formatDate } from "./util.ts";

const validate = (input: string | null): Result<number, string> => {
  if (!input?.trim()) {
    return err("1以上20以下の数値を指定してください。");
  }
  const num = Number(input);
  if (isNaN(num) || num < 1 || num > 20) {
    return err("1以上20以下の数値を指定してください。");
  }
  return ok(num);
};

const fetchItems = async (limit: number): Promise<Result<Item[], string>> => {
  const res = await fetch("https://zenn.dev/t_o_d/feed");
  if (!res.ok) {
    return err("記事を取得できませんでした。");
  }
  const xml = await res.text();
  const value = parse(xml);
  const items = value.rss.channel.item as Item[];
  return ok(items.slice(0, limit));
};

const input = prompt("取得数(最大20): ");
const limit = validate(input);
if (limit.isErr()) {
  console.error(limit.error);
  Deno.exit(1);
}

const spinner = new Spinner({
  message: "取得中.....",
  color: "yellow",
});
spinner.start();
const items = await fetchItems(limit.value);
if (items.isErr()) {
  spinner.stop();
  console.error(items.error);
  Deno.exit(1);
}

spinner.stop();
items.value.forEach((item) => {
  console.log(`${formatDate(item.pubDate)}\t${item.title}`);
});
