/**
 * Config.gs
 * Central place for all 13 Spreadsheet IDs + key Drive folder IDs.
 * Every other .gs file references SPREADSHEET_IDS.<Name> instead of
 * hardcoding IDs, so if a spreadsheet is ever recreated, only this file
 * needs to change.
 */
var SPREADSHEET_IDS = {
  SYS_Master:          '1JH7iujsO3lFhKXXVSPuZyZW_BkfG3VUJKD3r83bGx08',
  Personal_Info:       '12VnpQpOhsCqQCgNR-hMUBAMVB_qvR4hyMX2R7PzmVsY',
  Budget_Management:   '1DpVBTSWuvAmDCGaS6oM0-P3iW79Q4e1SnkzT5XUbVQI',
  Power_Grid:          '1fYrd1mD6RTORWymKgW8G2FIQvdNQNEIbXdn8_AGvx44',
  Tax:                 '16evpNwAyM5q5EpY6AulQzWONsgw8vpxcGB8hQKzTzRw',
  Zakat_Fitra:         '1vd4JIZXS0onyvmcg0CANbr0tT76L_3AXLrprmuq-SNY',
  Prince_Hisab:        '1dZwFN3Au6fISudCbYXpF7A21bQETamkZrBBuRBduc9E',
  My_Transactions:     '1ubkcTdUtdfenWyAmW_GrSxw-Q71EC2_fXgzue3hzdWk',
  Emergency_Documents: '1p7fL6G_-atcyHMVz8Xw3BDqQIiYQV_k_8c0dFaKUezo',
  Assets_Items:        '18YAb28N5xZxXv_zgqWbBavZ9m-a4DFXlJ3A3uNymYVo',
  Islamic_Corner:      '1Ss2x1Z_Msaa8St9C9byAZyJxiKuovLv7kK09hsCQeVc',
  AI_Hub:              '1re9QT28u2RXj9ytn9xo3ac8RjimepkTCF4pwiOM9MEM',
  Settings:            '1IBf2hZG5tueTGlqdEKkaqTJUoTA_WWJvZzlOJQGSHOw'
};

var DRIVE_FOLDER_IDS = {
  PhotosAndFiles: '1NVVO_AOOIyvKNOkrEzkl8dGObaxfIJxt',
  HomeSlideshow: '1d-diVZoawjhxFybeaR7ruqv4nZ0RwCN8'
};

/**
 * Fixed approved logo — per the blueprint's Home Page rule, this is NOT
 * user-changeable from Settings. To replace it, update this ID here only.
 */
var DRIVE_FILE_IDS = {
  Logo: '14g67FPRzOI_iD0ge_HVq-rASZLb87ViP'
};