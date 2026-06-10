# IdeaHub MVP

アイデアを投稿し、コメント・いいね・実行報告・メンタルシーソーで思考整理できる SNS MVP です。

## 技術構成

- Next.js
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Tailwind CSS
- shadcn/ui 風のローカル UI コンポーネント

## 主な画面

- `/` トップページ
- `/feed` 公開フィード
- `/ideas` マイアイデア
- `/ideas?box=completed` 実行済み
- `/ideas?box=archived` アーカイブ
- `/ideas/new` 投稿作成
- `/ideas/[id]` 投稿詳細
- `/profiles/[id]` プロフィール
- `/seesaws` メンタルシーソー
- `/login` ログイン・ユーザー登録

## 環境変数

`.env.example` を参考に、ローカルでは `.env.local`、Vercel では Project Settings の Environment Variables に設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

必要な環境変数:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project Settings > API の Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Project Settings > API の anon public key

使わない環境変数:

- `SUPABASE_SERVICE_ROLE_KEY`

このアプリはブラウザから Supabase を使うため、service role key を置かないでください。管理者権限の処理が必要になった時だけ、別途 server-only の API や Edge Function で扱います。

## ローカルセットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ローカル Supabase を使う場合:

```bash
supabase start
```

`.env.local` は次のようにできます。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

ローカルの URL と anon key は `supabase status` で確認できます。

## Supabase DB セットアップ

新規 Supabase プロジェクトに最初から作る場合は、Supabase SQL Editor で `supabase/schema.sql` を実行してください。

既にテーブルを作成済みの Supabase では、`supabase/schema.sql` 全体を再実行しないでください。`type "idea_type" already exists` のようなエラーになります。

既存DBへ段階的に反映する場合は、`supabase/migrations/` の SQL を番号順に実行してください。プロフィール画像保存で失敗する場合は、特に次を実行してください。

```text
supabase/migrations/202606100014_profile_avatar_storage_fix.sql
```

画像アップロードには Supabase Storage の `avatars` と `idea-images` bucket が必要です。`schema.sql` または `202606100013_image_uploads.sql` / `202606100014_profile_avatar_storage_fix.sql` で作成されます。

一覧表示を速くする index を追加する場合は、次の migration も実行してください。

```text
supabase/migrations/202606100015_performance_indexes.sql
```

メンタルシーソーを本人だけが閲覧できる個人メモとして扱う場合は、次の migration も実行してください。

```text
supabase/migrations/202606100016_private_mental_seesaws.sql
```

アイデア投稿に最大4枚の画像添付を使う場合は、次の migration も実行してください。

```text
supabase/migrations/202606100017_idea_multiple_images.sql
```

質問・不具合報告フォームを使う場合は、次の migration も実行してください。

```text
supabase/migrations/202606100018_feedback_reports.sql
```

## Vercel デプロイ手順

1. GitHub などにこのプロジェクトを push します。
2. Vercel で New Project からリポジトリを Import します。
3. Framework Preset は Next.js を選びます。
4. Environment Variables に次を設定します。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy を実行します。
6. 発行された Vercel URL を Supabase Auth の URL 設定に追加します。

Build Command は通常 `npm run build`、Install Command は `npm install` のままで動きます。

このプロジェクトは手書きの Supabase 型定義と現在の `@supabase/supabase-js` 型の相性で、Next.js の本番ビルド時 TypeScript チェックだけが過剰に失敗する箇所があります。そのため `next.config.mjs` で Vercel build 時の型チェックをスキップしています。通常の確認では `npm run lint` を実行してください。

## Supabase Auth のリダイレクト URL 設定

Supabase Dashboard で次を設定します。

場所:

```text
Authentication > URL Configuration
```

設定:

- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URLs:
  - `https://your-vercel-domain.vercel.app/**`
  - `https://your-vercel-domain.vercel.app/auth/callback`
  - 独自ドメインを使う場合: `https://your-domain.com/**`
  - 独自ドメインを使う場合: `https://your-domain.com/auth/callback`
  - ローカル確認も続ける場合: `http://localhost:3000/**`
  - ローカル確認も続ける場合: `http://localhost:3000/auth/callback`

パスワード再設定メールは、開いているサイトの origin を使って `/auth/callback?next=/auth/update-password` に戻します。callback route で Supabase Auth の `code` を cookie セッションに交換してから、パスワード更新画面へ遷移します。本番では Vercel URL、独自ドメイン利用時は独自ドメインを Supabase Auth の Redirect URLs に追加してください。

## localhost 依存について

アプリコード内に本番動作を妨げる localhost 固定 URL は置かない方針です。Supabase の接続先は環境変数で切り替えます。

ローカル用の `http://127.0.0.1:54321` や `http://localhost:3000` は README と `.env.local` のみで使います。本番では Vercel の環境変数に Supabase 本番プロジェクトの URL と anon key を設定してください。

## 本番確認チェックリスト

デプロイ後、スマホのブラウザでも次を確認します。

- [ ] `/` が表示できる
- [ ] `/feed` が未ログインでも表示できる
- [ ] 新規ユーザー登録ができる
- [ ] ログイン直後にヘッダーがログイン済み表示になる
- [ ] プロフィールを開ける
- [ ] プロフィール文を保存できる
- [ ] プロフィール画像をアップロードできる
- [ ] `/ideas/new` でアイデアを投稿できる
- [ ] アイデア画像を添付できる
- [ ] 公開投稿が `/feed` に表示される
- [ ] private 投稿が本人以外に表示されない
- [ ] `/ideas` に自分の active アイデアだけ表示される
- [ ] 「自分で実行した」で実行済みに移動する
- [ ] `/ideas?box=completed` に実行済みが表示される
- [ ] アーカイブできる
- [ ] `/ideas?box=archived` にアーカイブ済みが表示される
- [ ] アーカイブから復元できる
- [ ] アーカイブ内から削除できる
- [ ] 投稿詳細でコメントできる
- [ ] 投稿詳細でいいねできる
- [ ] メンタルシーソーを作成・編集できる
- [ ] ログアウトできる
- [ ] スマホ幅で横スクロールや表示崩れがない

## セキュリティ確認

- `.env.local` と `.env` は `.gitignore` に含めています。
- フロントに置くキーは `NEXT_PUBLIC_SUPABASE_ANON_KEY` のみです。
- `SUPABASE_SERVICE_ROLE_KEY` はこのアプリに設定しないでください。
- RLS を前提に anon key で動かします。
- private アイデアは RLS と画面側の両方で本人のみ閲覧する設計です。
- 画像は `avatars` と `idea-images` bucket の Storage policy で制御します。

デプロイ前に、リポジトリへ `.env.local` が入っていないことを確認してください。
