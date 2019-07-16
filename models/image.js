module.exports = (sequelize, DataTypes) => {
  const { STRING } = DataTypes;
  const Image = sequelize.define('Image', {
    src: { // S3 저장
      type: STRING(200),
      allowNull: false,
    },
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    underscored: true,
  });
  Image.associate = (db) => {
    db.Image.belongsTo(db.Post);
  };
  return Image;
};
