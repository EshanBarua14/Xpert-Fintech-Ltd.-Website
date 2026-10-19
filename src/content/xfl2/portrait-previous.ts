/**
 * Fingerprints (SHA-256) of the portrait files used before 15 October 2026,
 * when every portrait was re-made at 2160 pixels tall (same framing, same
 * face). The content seed swaps those earlier files for the new ones in place,
 * so every person, card and crop keeps working with no re-upload.
 */
export const PREVIOUS_PORTRAITS: Record<string, string | string[]> = {
  "aminul-islam": "46d0aa5730c65fbba9e749371bedd7722d9a7e30349ce6c7f2de198a2464e8e1",
  "bishnu-pada-kunda": ["5e3185c1c06dacef9997e5e1f0e21d704b52d3c481575717f9e3b1f5355a572b", "a754c94f7248585f1c24bcc12b618efac790f744a4a06fa37fdc851277112c2e"],
  "dilip-kajuri": "00e8925b6282c40615911568d0f9d529b75be9ad7e7528eecb1428fb29f86399",
  "eshan-barua": ["ef8a4de53dfb73cdff3768faede53fe8a49499304ad9a5eeb23a05cc4c247bc9", "592c6f7de22b2854b9bc97879d477ec7f3a1de54185d7ca3b9ff99c77fa6892c", "ab05054fc2d587d49822668c67a6d38f8084d559af50cbd61d4186a97a267e98"],
  "fakruddin-ali-ahmed-rajib": ["afbeed2fb055b9ec42099f5a7702b6537b22149dc91a3a092d76b47ccda2736a", "42302e473195d88c011a23b8b7f0b4c33382a46ca90bd3f6455bed8315e3e241"],
  "m-shahryar-faiz": ["ea342932942d2df4cf78bae73c1df35717fe8388aa55c965cb3943a31b094129", "7c1e96915b8651bfa445080db6baaf0901d6af6ff5b252c954f4b1b17ec31ce4"],
  "mahmuda-yasmin-farah": "d2d40dafb59a8b942c045c72a7e451743e98d2770bdd6ec087f6b7e76f34b3de",
  "md-abdur-rahman-rony": ["522481ca12d0a2f3e4e4566865118f7f72ad3e115400a370a13aa4a11f943014", "52472168a54ddfafa3e9391c446f07440ab4ba5dde2fd837726c160504eba409"], // new photo supplied 19 Oct 2026
  "md-abul-moshad-chowdhury": ["ccf90da0a0baad51bd85bcb17559d775e32d404160ab42ede9530e094d46d55a", "9d5b5c66dbd0f0efb2f73c1cdabf10a36589e67350b23b7667d971d894ffd7a2"], // new photo supplied 19 Oct 2026
  "md-hasan-uddin": ["213d2b8fe237f222274e92a300db69df4aeb62735ec633f1f20f2fa3d0e4adb7", "71b99f407f10eb6f67a72a6160ec08fdcbb3af8780705a9681268c974235c38b"], // new photo supplied 19 Oct 2026
  "md-hefaj-uddin": ["bf5de074508615a0b00a38173e69c5f94998c53189a714c76ee78b557dba12b1", "7c8dc7a0a561a2388a8a463e0bf862d7799b248e0c9eaea904653dd3e7ee1c22"], // new photo supplied 19 Oct 2026
  "md-refat-hossen": "9930199f57a309d6263cc50d5519e114045b06fa66777733b4d16456c24b5b18",
  "md-shahinur-rahman": ["ce8165221bbef631a90533e2ce21d9c339f6ecf2861a51c70b1fa1f14d194c88", "71fe61342016209a69afd06593fb3515b8ab087437764fc66b30d85559307676"], // new photo supplied 19 Oct 2026
  "md-sirajul-islam": ["900db2e75d64718c2fa72c0521e7c9065a58fa663aa47758e0ea57acf3415a87", "b730f8f1787136a28435e90a232b3b2da7224067193d15a4c5ab6d55f1165840"], // new photo supplied 19 Oct 2026
  "md-yeasin-hossain": ["b27e9a55acb7f1d2ab71aabb76be1428c3605124f88ac154f01147523c6d58e9", "26f056caad95b25753b10e5d8a1102b1eb6dc79f815c660626dab1c7705d7f6c"], // new photo supplied 19 Oct 2026
  "mohammad-ali": "5ee3b4bc18c7dd32adf3f0ecbc6d1126b2949376841112660125a1cd807b6ed4",
  "mohammad-ashiqur-rahman-bhuiyan": "f7eb7e5233737a6433c6ff9d93d56b851b900a9f1eba2807424b8b3ed2ba0465",
  "mohammad-erfanul-islam": ["e7d8270412e2f7463be19a40b49d5825e96b658f88f54a6a5f86d5f6f3908989", "0ad53f2cbc2b20435af67c420c3b6b6ea70b9f168aa0523b8f0ab2300f48b909"], // new photo supplied 19 Oct 2026
  "mohammad-mehrabul-ferdous": ["dbd5bd4e31b3bba485667b071a4fd222f5ab9d2944dca37d4e275f9caeedbb2c", "d1bfba5ddcd589d8f58e7204115f524f57ae96a3ee168ca977f95c6418fea60b"], // new photo supplied 19 Oct 2026
  "mohammed-rahmat-pasha": "94f55f06c79a4c4888ab81c2206aef1bec9283325e3ca3d32d39c4910f1fa00a",
  "mohd-shaahed-imran": "328ce3b6e8bbae8c804d2c0685cfc5d952e3c4f9ccd5caede039f7ef98bdd0a2",
  "muhammad-shamsul-maruf": ["f675c5ad7c278ce296e4c711a71af9bd1009044722085b08f42171fc4d4131c0", "d13d36afc2ced9e31f7293ca8466e328d2d45b30eb16422159c86b275664e35b"], // new photo supplied 19 Oct 2026
  "nafis-hasan-khan": "7a3dcdc1a93c250600213a33cfb4dcbc17cff001597e119f4adf12aca1f91a90",
  "najmul-hasan-rifat": ["6d373c6142d32b1ce72d469811df5ba390a190cc389d76359dab978a5aa9f21c", "59c78c3e937db1266a0dc355e227f8f682a400cc419621a3c6cc9bde764a45d9"], // new photo supplied 19 Oct 2026
  "saikat-biswas": ["70cbfc7652e1540fe4df8fafb61c80bf6781209d1e5ce23e66473880529ca12d", "196a8e5a389cca418f09681dcc029347c333d5a215fa494ad4497017d812bfc5"], // new photo supplied 19 Oct 2026
  "shaleh-akram": ["c39aa7072c8ed2e91df8404a4e3c3a0becbaf108a938c373788ac501dd511c93", "9ca628b8c3083baa2fefb4dc3c9feb87e807bc08a102e15710a48f8afe471da0", "1f1f5fb558b56a0ec9719dc6de7dafb5d54e437158d121775d7523f40e4c2c02"], // newest photo supplied 19 Oct 2026 (evening)
  "shamsher-morshed": "bd3dfe193a6927eb94a0de31363707ba756b13d13f0d57ff0deeaf0b8cdedc24",
  "sumon-das": "72302ea3945c72f68a2eb2b6c485e9cb1161ddcab6eacdc65417c64902e4a0ab",
  "talukder-juhaer-hakim": ["1632c794d1dfcc2da9463c5105fa34067529e9a17f9ecfcc00ca082d2f588c87", "747ffddb93f5ac8eda309f4a8047ce42b1e7fc4c329940b97e22a18962170bab"], // new photo supplied 19 Oct 2026
  "toha-hossain": ["06b8713980cebdad37402941c83a0ce5791764b2e3fc36663a52dafa45244b38", "4987e7709539ceecaa59dbcc87b9d805fcde9e3fedfc8b3359ada590b0c62a43", "c2b43c4533e460d8826c9e49e68e1c958ac7b5c330c214ba438be239c677bb6f", "fe7cd28c0d633042b6d9e0dbfdfe7f7821f5a870ec76b6ebb89b6751fe710759", "c3e1d023374bbcd85bd174965add799ffd12cc515d2b470c994a717c7e5c1727"],
};
