export type Joke = {
  top: string;
  bottom: string;
  tag: string;
};

export const JOKES: Joke[] = [
  { tag: "any", top: "我可以的", bottom: "我其實不行" },
  { tag: "any", top: "計畫很完美", bottom: "執行是另一回事" },
  { tag: "any", top: "再五分鐘", bottom: "已經過了五小時" },
  { tag: "any", top: "今天狀態很好", bottom: "好的部分是裝的" },
  { tag: "any", top: "沒有人問我", bottom: "但我還是要說" },
  { tag: "any", top: "看起來很忙", bottom: "其實在發呆" },
  { tag: "any", top: "我有在聽", bottom: "我完全沒在聽" },
  { tag: "any", top: "這很簡單", bottom: "那你來" },
  { tag: "any", top: "我不生氣", bottom: "我只是安靜地生氣" },
  { tag: "any", top: "今晚早睡", bottom: "滑到三點" },
  { tag: "any", top: "我決定改變", bottom: "從明天開始" },
  { tag: "any", top: "一切都在掌握中", bottom: "掌握的人不是我" },
  { tag: "any", top: "會議很有收穫", bottom: "收穫是更累" },
  { tag: "any", top: "我很好", bottom: "這句是自動回覆" },
  { tag: "any", top: "相信過程", bottom: "過程不太相信我" },
  { tag: "any", top: "問題不大", bottom: "問題其實很大" },
  { tag: "any", top: "我先看一眼", bottom: "一看就是一小時" },
  { tag: "any", top: "保持冷靜", bottom: "內心已經罷工" },
  { tag: "any", top: "這次一定準時", bottom: "上次也是這樣說" },
  { tag: "any", top: "我有備份", bottom: "備份在哪還在找" },

  { tag: "cat", top: "你叫我？", bottom: "我沒有要理你" },
  { tag: "cat", top: "罐罐呢", bottom: "人可以先離開" },
  { tag: "cat", top: "我很乖", bottom: "沙發是我的" },
  { tag: "cat", top: "不要再拍了", bottom: "再拍我就走" },
  { tag: "cat", top: "這是我的位子", bottom: "你只是暫住" },
  { tag: "cat", top: "摸一下可以", bottom: "第二下再議" },
  { tag: "cat", top: "我沒有打翻", bottom: "它自己掉下去的" },
  { tag: "cat", top: "深夜三點", bottom: "是我的上班時間" },

  { tag: "dog", top: "你去哪", bottom: "我也去" },
  { tag: "dog", top: "我沒有偷吃", bottom: "嘴上的不是證據" },
  { tag: "dog", top: "散步了嗎", bottom: "這是今天唯一的問題" },
  { tag: "dog", top: "我錯了", bottom: "但我不知道錯在哪" },
  { tag: "dog", top: "你一回家", bottom: "我就原諒全世界" },
  { tag: "dog", top: "球呢", bottom: "人生其他都可以等" },
  { tag: "dog", top: "我守著家", bottom: "也守著你的拖鞋" },
  { tag: "dog", top: "再出去一次", bottom: "我保證這次很短" },

  { tag: "rain", top: "我想出門", bottom: "天空不同意" },
  { tag: "rain", top: "適合工作", bottom: "更適合發呆" },
  { tag: "rain", top: "雨會停", bottom: "訊息不會" },
  { tag: "rain", top: "帶傘了嗎", bottom: "當然沒有" },
  { tag: "rain", top: "窗外很吵", bottom: "心裡更吵" },
  { tag: "rain", top: "今天取消", bottom: "明天也先保留" },
  { tag: "rain", top: "適合聽歌", bottom: "不適合回覆" },
  { tag: "rain", top: "我看著雨", bottom: "雨沒有看我" },

  { tag: "doors", top: "選左邊", bottom: "選右邊也一樣" },
  { tag: "doors", top: "這扇門", bottom: "還是那扇門" },
  { tag: "doors", top: "進去之前", bottom: "我想先退出" },
  { tag: "doors", top: "兩個選擇", bottom: "我選躺著" },
  { tag: "doors", top: "門後面是機會", bottom: "也可能是會議" },
  { tag: "doors", top: "我做了決定", bottom: "決定是先不決定" },
  { tag: "doors", top: "開這一扇", bottom: "另一扇在笑話我" },
  { tag: "doors", top: "看起來都很好", bottom: "所以我站在中間" },

  { tag: "desk", top: "再一封信", bottom: "然後就下班" },
  { tag: "desk", top: "燈還亮著", bottom: "人已經不在了" },
  { tag: "desk", top: "今日待辦", bottom: "變成明日待辦" },
  { tag: "desk", top: "咖啡喝完了", bottom: "事情沒有" },
  { tag: "desk", top: "我在忙", bottom: "忙著看起來在忙" },
  { tag: "desk", top: "這個檔案", bottom: "昨天的我也看不懂" },
  { tag: "desk", top: "五點下班", bottom: "五點開始真的上班" },
  { tag: "desk", top: "螢幕很亮", bottom: "想法很暗" },

  { tag: "microwave", top: "再轉三十秒", bottom: "中間還是冷的" },
  { tag: "microwave", top: "晚餐解決了", bottom: "營養沒有" },
  { tag: "microwave", top: "叮的一聲", bottom: "一天就這樣過去" },
  { tag: "microwave", top: "加熱即可", bottom: "感情不行" },
  { tag: "microwave", top: "我有煮飯", bottom: "煮飯機有煮飯" },
  { tag: "microwave", top: "看起來可以吃", bottom: "味道再說" },
  { tag: "microwave", top: "三分鐘就好", bottom: "站在這裡等很久" },
  { tag: "microwave", top: "剩菜重生", bottom: "味道也重生了" },
];

export function nextJoke(tag: string, avoidTop: string): Joke {
  const themed = JOKES.filter((joke) => joke.tag === tag && joke.top !== avoidTop);
  const general = JOKES.filter((joke) => joke.tag === "any" && joke.top !== avoidTop);
  const pool = themed.length > 0 ? themed : general;
  const list = pool.length > 0 ? pool : JOKES;
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? JOKES[0];
}
