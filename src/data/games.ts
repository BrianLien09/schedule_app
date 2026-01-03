export interface GameLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface GameCharacter {
  name: string;
  resonanceCode?: string;
}

export interface GameVersion {
  version: string;
  characters: GameCharacter[];
  links?: GameLink[];
}

export interface Game {
  id: string;
  name: string;
  icon?: string;
  links: GameLink[]; // General links
  versions?: GameVersion[];
}

export const games: Game[] = [
  {
    id: 'reverse-1999',
    name: '重返未來：1999',
    icon: '🌧️',
    versions: [
      { 
        version: '3.1', 
        characters: [
          { name: '野樹莓', resonanceCode: 'AjwAPBD8BToEJiAkITFSMVRMZkxGMzQ5QTRQSDRIQA==' },
          { name: '告死鳥', resonanceCode: 'ASoAKAE8IEFQQVL0Q0hlKUVDMiQELRQmJEUwOUA=' }
        ],
        links: [
           { id: 'v31-1', title: '【角色】野樹莓 - 薪血隊最後一塊拼圖', url: 'https://www.taptap.cn/moment/718173987636514461', description: '六星 木屬性 輔助' },
           { id: 'v31-2', title: '【角色】告死鳥 - 電能隊核新C，長軸之神', url: 'https://www.taptap.cn/moment/725428213244758184', description: '六星 智屬性 輸出' },
           { id: 'v31-3', title: '【活動】冷鐵 - 全通關攻略', url: 'https://www.taptap.cn/moment/725281520306094345', description: '版本活動 限時領取' }
        ]
      },
      {
        version: '3.2',
        characters: [
          { name: '貝麗爾', resonanceCode: 'AjhFNAI0ADwgPDA6BCkFK0QrQPQkRENBUkBB' },
          { name: '灰調藍' , resonanceCode: 'ATwAPBAmUDhC8CQ0FTREKFQqBCQhQSBDQEQy'}
        ],
        links: [
           { id: 'v32-1', title: '【角色】貝麗爾 - 週年大C，餘暉隊核心', url: 'https://www.taptap.cn/moment/733044921438569435', description: '六星 獸屬性 輸出' },
           { id: 'v32-2', title: '【角色】灰調藍 - 新時代電能隊新輔C', url: 'https://www.taptap.cn/moment/740636166335759363', description: '五星 星屬性 輔助' },
           { id: 'v32-3', title: '【上半活動】命運的雨季 - 全通關攻略', url: 'https://www.taptap.cn/moment/732909496178839006', description: '3.2 上半版本活動' },
           { id: 'v32-4', title: '【下半活動】無燒 - 全通關攻略', url: 'https://www.taptap.cn/moment/740466917403265017', description: '3.2 下半版本活動' }
        ]
      },
      {
        version: '3.3',
        characters: [
          { name: '瑪爾紗', resonanceCode: 'BTwAPBA0IDQiKgQpFfA0QyQ7VDpDQVFEUENBTEA=' },
          { name: '伊戈爾' , resonanceCode: 'AfQkNAE9ACYhNEA8YCpCOVMoEjgFKgMnRQ=='}
        ],
        links: [
           { id: 'v33-1', title: '【角色】瑪爾紗 - 餘暉隊的花環，跨時代的盾奶', url: 'https://www.taptap.cn/moment/748259688637795101', description: '六星 岩屬性 防禦' },
           { id: 'v33-2', title: '【角色】伊戈爾 - 新手養成指南', url: 'https://www.taptap.cn/moment/755855972479533766', description: '五星 木屬性 輸出' },
           { id: 'v33-3', title: '【上半活動】以騎士之名 - 全通關攻略', url: 'https://www.taptap.cn/moment/748127427296759347', description: '3.3 上半版本活動' },
           { id: 'v33-4', title: '【下半活動】風暴前夕 - 全通關攻略', url: 'https://www.taptap.cn/moment/755693322269363732', description: '3.3 下半版本活動' }
        ]
      }
    ],
    links: [
      { id: '1', title: 'Taptap 小丸犊几 - 攻略大佬', url: 'https://www.taptap.cn/user/8268254' },
      { id: '2', title: '官方網站', url: 'https://re1999.bluepoch.com/tw/' },
    ]
  },
  {
    id: 'hsr',
    name: '崩壞：星穹鐵道',
    icon: '🚂',
    links: [
      { id: '1', title: '玉衡杯', url: 'https://homdgcat.wiki/sr/char?lang=CH', description: '懂得都懂' },
      { id: '2', title: '星穹鐵道工坊', url: 'https://www.prydwen.gg/star-rail/', description: '角色強度排行與組隊建議 (英文)' },
    ]
  }
];
