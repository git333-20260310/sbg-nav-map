# SBG NAV MAP

公開URL: https://git333-20260310.github.io/sbg-nav-map/

ソフトバンクグループ（9984）の現在NAV、傘下・投資先、将来NAVシナリオを同じマインドマップ上で確認するWebアプリです。Mac StudioとiPad横向きを主対象にしています。現在値・基準日・出典は `src/data/nav-data.json` だけを更新すれば画面全体に反映されます。

## 主な機能

- 2026年6月末（2027年3月期Q1）の公式NAV7区分を表示
- 現在値・基準日・発表日・出典を1ファイルで一元管理
- 公式NAV式、区分合計、出典ID、2042年目標式をビルド前に自動検証
- 各区分を選ぶと、主要な傘下企業・投資先・案件を表示
- 孫正義氏が株主総会で示した「2042年NAV 1,000兆円」を初期シナリオに設定
- 親項目および「その他 / 新規AI」の子項目の2042年価値を手入力
- 子項目合計から親項目を自動計算
- 将来純負債を変更し、将来NAVと1株NAVを自動計算
- 現在／将来／差分表示
- ブラウザ内へのシナリオ保存、リセット、JSON出力

## 起動

```bash
pnpm install
pnpm run dev
```

## 決算発表後の更新

更新するファイルは原則 [`src/data/nav-data.json`](src/data/nav-data.json) だけです。

1. `datasetId`、`updatedAt`、`period` を新しい決算期に変更する。
2. `reported` の保有株式価値、純負債、NAV、LTV、株式数、`sourceId` を更新する。
3. `sources` に公式決算資料のURL、発表日、参照ページを追加する。
4. `buckets[].current` と、開示がある主要投資先の `children[].current` を更新する。個別非開示は `null` のままにする。
5. 検証と本番ビルドを実行する。

```bash
pnpm run data:check
pnpm run build
```

`main` ブランチへpushすると `.github/workflows/deploy-pages.yml` が同じ検証付きビルドを実行し、GitHub Pagesへ公開します。区分内訳の丸め差が0.02兆円以内なら警告として表示し、NAV式や出典参照が壊れている場合は公開を止めます。

ブラウザに保存するのは2042年シナリオの入力値だけです。公式の現在値は保存対象外なので、決算データを更新しても古いローカル保存が上書きしません。

## データ上の注意

- 現在の保有資産83.11兆円、純負債10.81兆円、NAV72.30兆円は2026年6月末のSBG公式開示値です。
- 各公式区分の丸め後内訳合計は83.10兆円になりますが、総額は公式値83.11兆円を優先しています。
- 「その他」の子項目には、開示値、買収対価、概算参考値、個別非開示項目が混在します。子項目は現在NAVの監査済み分解ではなく、将来シナリオを考えるための分析レイヤーです。
- 2042年NAV 1,000兆円は会社目標ですが、資産別内訳は開示されていません。初期値は、保有資産1,150兆円－純負債150兆円＝NAV1,000兆円となる分析仮定です。
- 初期配分はArm 300兆円、SVF2 / OpenAI 350兆円、SVF1 50兆円、SoftBank Corp. 50兆円、LatAm 15兆円、その他 / 新規AI 380兆円、T-Mobile 5兆円です。
- 純負債150兆円（LTV約13%）、資産別配分、2042年の発行済株式数を現在と同じとする計算は会社予想ではなく、編集可能な分析仮定です。

Q1公式資料: [2027年3月期 第1四半期決算 投資家向け説明会資料](https://group.softbank/media/Project/sbg/sbg/pdf/ir/presentations/2026/investor-presentation_q1fy2026_01_ja.pdf)

公式NAV: [ソフトバンクグループ 1株当たりNAV情報](https://group.softbank/ir/stock/sotp)

目標資料: [第46回定時株主総会](https://group.softbank/ir/investors/shareholders/2026)
