"""Rename cards table to scenarios

Revision ID: 2604ebff9c0c
Revises: 2f05a5310f15
Create Date: 2026-03-15 09:24:27.910436

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2604ebff9c0c'
down_revision = '2f05a5310f15'
branch_labels = None
depends_on = None


def upgrade():
    # Rename cards table to scenarios
    op.rename_table('cards', 'scenarios')

    # Rename foreign key column card_id -> scenario_id on game_rounds
    with op.batch_alter_table('game_rounds', schema=None) as batch_op:
        # Drop existing FK constraint on card_id
        batch_op.drop_constraint('game_rounds_card_id_fkey', type_='foreignkey')

        # Rename the column (preserves existing data)
        batch_op.alter_column('card_id', new_column_name='scenario_id')

        # Recreate the FK pointing to scenarios.id
        batch_op.create_foreign_key(
            None,          # let Alembic generate a name
            'scenarios',   # new referenced table
            ['scenario_id'],
            ['id'],
        )


def downgrade():
    # Reverse the operations: rename scenarios back to cards
    op.rename_table('scenarios', 'cards')

    # Rename scenario_id -> card_id and restore FK
    with op.batch_alter_table('game_rounds', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.alter_column('scenario_id', new_column_name='card_id')
        batch_op.create_foreign_key(
            batch_op.f('game_rounds_card_id_fkey'),
            'cards',
            ['card_id'],
            ['id'],
        )
