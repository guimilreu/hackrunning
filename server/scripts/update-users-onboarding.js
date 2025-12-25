import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/index.js';
import { logger } from '../src/utils/logger.js';

// Carregar variáveis de ambiente
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack-running';

// IDs dos usuários a serem atualizados
const USER_IDS = [
  '6945aa9f11aea401c8557f34',
  '6945c36711aea401c8558168',
  '6945c33811aea401c8558125',
  '6945c66d11aea401c8558235',
  '6945eaa711aea401c8558770',
  '6946a13c11aea401c8558980',
  '694946bc11aea401c85592ad',
  '6949590111aea401c8559502'
];

async function updateUsers() {
  try {
    // Conectar ao banco de dados
    logger.info('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB conectado com sucesso');

    // Converter strings para ObjectId
    const userIds = USER_IDS.map(id => new mongoose.Types.ObjectId(id));

    // Atualizar usuários
    logger.info(`Atualizando ${USER_IDS.length} usuários...`);
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          'onboarding.completed': true,
          'onboarding.completedAt': new Date(),
          'kickstartKit.purchased': true,
          'plan.type': 'plus',
          'plan.status': 'active',
          'plan.startDate': new Date()
        }
      }
    );

    logger.info(`✅ ${result.modifiedCount} usuário(s) atualizado(s) com sucesso`);
    logger.info(`📊 Total de documentos encontrados: ${result.matchedCount}`);

    // Verificar quais usuários foram atualizados
    const updatedUsers = await User.find({ _id: { $in: userIds } })
      .select('_id name email onboarding.completed kickstartKit.purchased plan.type plan.status');

    logger.info('\n📋 Usuários atualizados:');
    updatedUsers.forEach(user => {
      logger.info(`  - ${user.name} (${user.email})`);
      logger.info(`    ID: ${user._id}`);
      logger.info(`    Onboarding: ${user.onboarding?.completed ? '✅' : '❌'}`);
      logger.info(`    Kickstart Kit: ${user.kickstartKit?.purchased ? '✅' : '❌'}`);
      logger.info(`    Plano: ${user.plan?.type} (${user.plan?.status})`);
      logger.info('');
    });

    // Verificar se algum usuário não foi encontrado
    const foundIds = updatedUsers.map(u => u._id.toString());
    const notFoundIds = USER_IDS.filter(id => !foundIds.includes(id));
    
    if (notFoundIds.length > 0) {
      logger.warn('⚠️  IDs não encontrados:');
      notFoundIds.forEach(id => logger.warn(`  - ${id}`));
    }

  } catch (error) {
    logger.error('❌ Erro ao atualizar usuários:', error);
    throw error;
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    logger.info('Conexão com MongoDB fechada');
    process.exit(0);
  }
}

// Executar script
updateUsers().catch(error => {
  logger.error('Erro fatal:', error);
  process.exit(1);
});

